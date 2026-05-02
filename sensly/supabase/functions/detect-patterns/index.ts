import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Pattern detection thresholds
const QUICK_LEAVE_MINUTES = 20   // dwell time under this = "left quickly"
const QUICK_LEAVE_COUNT   = 3    // how many times before we warn
const PATTERN_DAYS        = 90   // look back window in days

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { venue_id, venue_category } = await req.json()

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

    const since = new Date()
    since.setDate(since.getDate() - PATTERN_DAYS)

    // Pattern 1: Has user rated this specific venue poorly before?
    const { data: venueRatings } = await supabase
      .from('ratings')
      .select('overall_score:noise_db, crowding, lighting, created_at')
      .eq('venue_id', venue_id)
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())

    // Pattern 2: Has user consistently rated this category poorly?
    // Get all venues in this category the user has rated
    const { data: categoryRatings } = await supabase
      .from('ratings')
      .select('noise_db, crowding, lighting, venue_id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .not('venue_id', 'is', null)

    // Pattern 3: Day-of-week sensitivity
    // Check if user tends to rate crowding high on certain days
    const { data: activityLog } = await supabase
      .from('user_activity')
      .select('created_at, venue_id')
      .eq('user_id', user.id)
      .eq('activity_type', 'rating')
      .gte('created_at', since.toISOString())

    // --- Analyse patterns ---
    const warnings: string[] = []
    let confidence: 'high' | 'medium' | 'low' = 'low'

    // Pattern 1: Specific venue history
    if (venueRatings && venueRatings.length > 0) {
      const highNoise = venueRatings.filter(r => r.overall_score && r.overall_score > 70).length
      const highCrowd = venueRatings.filter(r => r.crowding && r.crowding >= 4).length
      if (highNoise >= 2) {
        warnings.push(`This place has felt loud to you before (${highNoise} previous visits)`)
        confidence = 'high'
      }
      if (highCrowd >= 2) {
        warnings.push(`This place has felt crowded to you before`)
        confidence = confidence === 'high' ? 'high' : 'medium'
      }
    }

    // Pattern 2: Category pattern
    if (venue_category && categoryRatings && categoryRatings.length >= QUICK_LEAVE_COUNT) {
      // Get venue IDs for this category
      const { data: categoryVenues } = await supabase
        .from('venues')
        .select('id')
        .eq('category', venue_category)

      if (categoryVenues) {
        const categoryVenueIds = new Set(categoryVenues.map(v => v.id))
        const categoryUserRatings = categoryRatings.filter(r =>
          r.venue_id && categoryVenueIds.has(r.venue_id)
        )

        const highNoiseInCategory = categoryUserRatings.filter(
          r => r.noise_db && r.noise_db > 70
        ).length

        if (highNoiseInCategory >= QUICK_LEAVE_COUNT) {
          warnings.push(
            `${venue_category.charAt(0).toUpperCase() + venue_category.slice(1)}s have felt loud to you ${highNoiseInCategory} times recently`
          )
          confidence = 'high'
        }
      }
    }

    // Pattern 3: Day-of-week — is today a historically hard day?
    if (activityLog && activityLog.length >= 5) {
      const today = new Date().getDay() // 0 = Sunday
      const todayRatings = categoryRatings?.filter(r => {
        const d = new Date(r.created_at)
        return d.getDay() === today && r.crowding && r.crowding >= 4
      }) ?? []

      if (todayRatings.length >= 2) {
        const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']
        warnings.push(`${days[today]} tend to feel crowded for you`)
        confidence = confidence === 'low' ? 'medium' : confidence
      }
    }

    // Return first warning only — don't overwhelm the user
    const warning = warnings.length > 0 ? warnings[0] : null

    return new Response(
      JSON.stringify({ warning, confidence, warning_count: warnings.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
