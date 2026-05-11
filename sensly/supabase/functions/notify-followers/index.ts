import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Supabase webhook — fires after INSERT on ratings table
// Sends push notification to users who follow the rated venue

serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get('SUPABASE_WEBHOOK_SECRET')
    const signature = req.headers.get('x-supabase-signature')
    if (!webhookSecret || signature !== webhookSecret) {
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await req.json()
    const newRating = payload.record  // the newly inserted rating row

    if (!newRating?.venue_id) {
      return new Response('No venue_id', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get venue name
    const { data: venue } = await supabase
      .from('venues')
      .select('name')
      .eq('id', newRating.venue_id)
      .single()

    if (!venue) return new Response('Venue not found', { status: 404 })

    // Get all followers of this venue (excluding the rater)
    const { data: followers } = await supabase
      .from('venue_follows')
      .select('user_id')
      .eq('venue_id', newRating.venue_id)
      .neq('user_id', newRating.user_id)

    if (!followers || followers.length === 0) {
      return new Response('No followers', { status: 200 })
    }

    // Get push tokens for followers from auth.users metadata
    const followerIds = followers.map(f => f.user_id)
    const { data: users } = await supabase.auth.admin.listUsers()

    const pushTokens = users?.users
      .filter(u => followerIds.includes(u.id))
      .map(u => u.user_metadata?.expo_push_token)
      .filter(Boolean) ?? []

    if (pushTokens.length === 0) {
      return new Response('No push tokens', { status: 200 })
    }

    // Send via Expo Push API
    const messages = pushTokens.map(token => ({
      to: token,
      title: 'New rating',
      body: `Someone rated ${venue.name}`,
      data: { venue_id: newRating.venue_id },
    }))

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    })

    return new Response(JSON.stringify({ sent: pushTokens.length }), { status: 200 })

  } catch (err) {
    return new Response('Internal server error', { status: 500 })
  }
})
