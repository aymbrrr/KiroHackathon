import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚠️  REQUIRES GROQ_API_KEY secret set in Supabase:
//     supabase secrets set GROQ_API_KEY=your-key
//
// Get a free key at console.groq.com
// This is the ONLY LLM call in the entire app — used once per user per week.
// Falls back to template strings if Groq is unavailable.

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if we already have fresh insights for this week
    const weekStart = getWeekStart()
    const { data: cached } = await supabase
      .from('journal_insights')
      .select('insights, generated_at')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single()

    if (cached) {
      return new Response(
        JSON.stringify({ insights: cached.insights, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Step 1: Query structured data for the past 7 days (pure SQL, no LLM) ---
    const since = new Date()
    since.setDate(since.getDate() - 7)

    const { data: ratings } = await supabase
      .from('ratings')
      .select('noise_db, lighting, crowding, smell, predictability, time_of_day, day_of_week, created_at, venue_id')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())

    const { data: checkins } = await supabase
      .from('daily_checkins')
      .select('noise_threshold_today, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())

    const { data: activity } = await supabase
      .from('user_activity')
      .select('activity_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())

    if (!ratings || ratings.length === 0) {
      const fallback = [{ text: 'Keep logging places to see your weekly patterns here.', type: 'prompt' }]
      return new Response(
        JSON.stringify({ insights: fallback, cached: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Step 2: Compute structured summary ---
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    const avgNoise = avg(ratings.map(r => r.noise_db).filter(Boolean))
    const avgCrowding = avg(ratings.map(r => r.crowding).filter(Boolean))

    // Worst day by average crowding
    const byDay: Record<number, number[]> = {}
    ratings.forEach(r => {
      if (r.day_of_week != null && r.crowding != null) {
        byDay[r.day_of_week] = byDay[r.day_of_week] ?? []
        byDay[r.day_of_week].push(r.crowding)
      }
    })
    const worstDayNum = Object.entries(byDay)
      .map(([day, scores]) => ({ day: Number(day), avg: avg(scores) }))
      .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1))[0]
    const worstDay = worstDayNum ? days[worstDayNum.day] : null

    // Hard days (check-ins with lowered threshold)
    const hardDayCount = checkins?.filter(c =>
      c.noise_threshold_today != null && c.noise_threshold_today < 60
    ).length ?? 0

    // Streak
    const streakDays = countStreak(activity ?? [])

    // Best time of day (lowest avg noise)
    const byTime: Record<string, number[]> = {}
    ratings.forEach(r => {
      if (r.time_of_day && r.noise_db != null) {
        byTime[r.time_of_day] = byTime[r.time_of_day] ?? []
        byTime[r.time_of_day].push(r.noise_db)
      }
    })
    const bestTime = Object.entries(byTime)
      .map(([time, dbs]) => ({ time, avg: avg(dbs) }))
      .sort((a, b) => (a.avg ?? Infinity) - (b.avg ?? Infinity))[0]?.time ?? null

    const summary = {
      ratings_count: ratings.length,
      avg_noise_db: avgNoise != null ? Math.round(avgNoise) : null,
      avg_crowding: avgCrowding != null ? avgCrowding.toFixed(1) : null,
      worst_day: worstDay,
      hard_day_count: hardDayCount,
      streak_days: streakDays,
      best_time_of_day: bestTime,
    }

    // --- Step 3: Try Groq for empathetic prose, fall back to templates ---
    let insights: { text: string; type: string }[]

    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (groqKey) {
      try {
        insights = await generateWithGroq(summary, groqKey)
      } catch {
        insights = generateFromTemplates(summary)
      }
    } else {
      insights = generateFromTemplates(summary)
    }

    // --- Step 4: Cache in journal_insights ---
    await supabase
      .from('journal_insights')
      .upsert({ user_id: user.id, week_start: weekStart, insights, generated_at: new Date().toISOString() })

    return new Response(
      JSON.stringify({ insights, cached: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// --- Helpers ---

function avg(nums: (number | null | undefined)[]): number | null {
  const valid = nums.filter((n): n is number => n != null)
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}

function getWeekStart(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}

function countStreak(activity: { activity_type: string; created_at: string }[]): number {
  if (!activity.length) return 0
  const days = new Set(activity.map(a => a.created_at.split('T')[0]))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (days.has(d.toISOString().split('T')[0])) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function generateFromTemplates(s: ReturnType<typeof Object.assign>): { text: string; type: string }[] {
  const insights: { text: string; type: string }[] = []

  if (s.worst_day) {
    insights.push({ text: `${s.worst_day}s tend to feel more overwhelming for you.`, type: 'pattern' })
  }
  if (s.best_time_of_day) {
    insights.push({ text: `${capitalize(s.best_time_of_day)}s are usually your quietest time of day.`, type: 'pattern' })
  }
  if (s.hard_day_count > 0) {
    insights.push({ text: `You had ${s.hard_day_count} sensitive day${s.hard_day_count > 1 ? 's' : ''} this week — that's okay.`, type: 'wellbeing' })
  }
  if (s.streak_days >= 3) {
    insights.push({ text: `🌱 ${s.streak_days} days of logging in a row.`, type: 'streak' })
  }
  if (insights.length === 0) {
    insights.push({ text: `You logged ${s.ratings_count} place${s.ratings_count !== 1 ? 's' : ''} this week. Keep going to see patterns.`, type: 'prompt' })
  }

  return insights
}

async function generateWithGroq(
  summary: Record<string, unknown>,
  apiKey: string
): Promise<{ text: string; type: string }[]> {
  const prompt = `You are a warm, supportive assistant helping a neurodivergent person understand their sensory patterns.
Based on this week's data, write 2-3 short, empathetic insights (1 sentence each).
Use plain language. Never use clinical terms. Never say "you failed" or imply weakness.
Focus on patterns and gentle observations.

Data: ${JSON.stringify(summary)}

Return a JSON array: [{"text": "...", "type": "pattern|wellbeing|streak"}]
Return ONLY the JSON array, no other text.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  if (!response.ok) throw new Error('Groq API error')

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? '[]'
  return parseGroqInsights(content)
}

function parseGroqInsights(content: string): { text: string; type: string }[] {
  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed)) throw new Error('Expected array')
  const VALID_TYPES = ['pattern', 'wellbeing', 'streak', 'prompt']
  return parsed
    .filter(item => typeof item?.text === 'string' && typeof item?.type === 'string')
    .map(item => ({
      text: item.text.slice(0, 280),
      type: VALID_TYPES.includes(item.type) ? item.type : 'pattern',
    }))
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
