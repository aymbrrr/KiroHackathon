import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Inline client for connection test — will be replaced by src/lib/supabase.ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Status = 'loading' | 'success' | 'error' | 'no-env';

export default function App() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [tableCount, setTableCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus('no-env');
      setMessage('EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY not set in .env');
      return;
    }

    async function testConnection() {
      try {
        // Test 1: basic connection — query venues table
        const { data, error, count } = await supabase
          .from('venues')
          .select('*', { count: 'exact', head: true });

        if (error) {
          setStatus('error');
          setMessage(`DB error: ${error.message}`);
          return;
        }

        // Test 2: verify profiles table exists
        const { error: profilesError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        if (profilesError) {
          setStatus('error');
          setMessage(`Profiles table missing: ${profilesError.message}\nDid you run the migration?`);
          return;
        }

        setTableCount(count ?? 0);
        setStatus('success');
        setMessage('Connected to Supabase ✓\nAll tables verified ✓');
      } catch (e: any) {
        setStatus('error');
        setMessage(`Unexpected error: ${e.message}`);
      }
    }

    testConnection();
  }, []);

  const colors = {
    loading: '#F8F6F2',
    success: '#E8F4FB',
    error:   '#FDECEA',
    'no-env': '#FFF8E1',
  };

  const icons = {
    loading: null,
    success: '✅',
    error:   '❌',
    'no-env': '⚠️',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors[status] }]}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color="#0077BB" />
          <Text style={styles.label}>Testing Supabase connection...</Text>
        </>
      ) : (
        <>
          <Text style={styles.icon}>{icons[status]}</Text>
          <Text style={styles.heading}>
            {status === 'success' ? 'Connection successful' :
             status === 'no-env' ? 'Missing .env config' :
             'Connection failed'}
          </Text>
          <Text style={styles.message}>{message}</Text>
          {status === 'success' && (
            <Text style={styles.detail}>
              venues table: {tableCount} rows
            </Text>
          )}
          <Text style={styles.hint}>
            {status === 'success'
              ? 'Step 1 complete — ready for Step 2 (auth)'
              : status === 'no-env'
              ? 'Copy .env.example to .env and fill in your Supabase credentials'
              : 'Check your Supabase project and run the migration SQL'}
          </Text>
        </>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1814',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#5C5750',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  detail: {
    fontSize: 13,
    color: '#8C8680',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#0077BB',
    textAlign: 'center',
    marginTop: 8,
  },
  label: {
    marginTop: 16,
    fontSize: 15,
    color: '#5C5750',
  },
});
