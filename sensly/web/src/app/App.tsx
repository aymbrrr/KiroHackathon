import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Welcome } from './pages/Welcome';
import { Onboarding } from './pages/Onboarding';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [childProfile, setChildProfile] = useState({
    name: 'Miles',
    age: 7,
    triggers: ['noise', 'lights', 'transitions'],
    preferences: { noiseThreshold: 70, lightThreshold: 500 },
  });

  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center sm:py-8"
      style={{ background: '#D8EFF4' }}
    >
      <div className="relative w-full sm:max-w-[390px] h-[100dvh] sm:h-[844px] sm:rounded-[48px] overflow-hidden z-10 shadow-[0_30px_90px_rgba(27,57,67,0.35)]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 h-7 w-36 rounded-b-3xl bg-[#15181b] sm:block hidden" />

        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<Welcome onGetStarted={() => setIsOnboarded(true)} />}
            />
            <Route
              path="/onboarding"
              element={
                <Onboarding
                  onComplete={(profile) => {
                    setChildProfile(profile);
                    setIsOnboarded(true);
                  }}
                />
              }
            />
            <Route
              path="/app"
              element={
                isOnboarded
                  ? <Layout childProfile={childProfile} />
                  : <Navigate to="/" replace />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
