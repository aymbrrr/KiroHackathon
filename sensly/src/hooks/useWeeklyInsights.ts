/**
 * Weekly insights check — runs on app foreground.
 *
 * Checks if journal insights exist for the current week.
 * If not, calls the generate-insights Edge Function and
 * fires a local push notification.
 *
 * Person A: call useWeeklyInsights() in your root component
 * or wherever you handle app foreground events.
 */
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

export function useWeeklyInsights() {
  const checkedThisSession = useRef(false);

  useEffect(() => {
    async function checkAndGenerate() {
      // Only check once per app session
      if (checkedThisSession.current) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = getWeekStart();

      // Check if insights already exist for this week
      const { data: existing } = await supabase
        .from('journal_insights')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      if (existing) {
        checkedThisSession.current = true;
        return; // Already generated this week
      }

      // Generate new insights
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {},
      });

      checkedThisSession.current = true;

      if (error || !data?.insights?.length) return;

      // Fire a local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your weekly sensory insights are ready',
          body: data.insights[0]?.text ?? 'Tap to see your patterns from this week',
          data: { screen: 'journal' },
        },
        trigger: null, // immediate
      });
    }

    // Run on mount
    checkAndGenerate();

    // Also run when app comes back to foreground
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkedThisSession.current = false; // Allow re-check on next foreground
        checkAndGenerate();
      }
    });

    return () => subscription.remove();
  }, []);
}
