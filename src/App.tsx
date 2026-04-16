import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Home } from '@/pages/Home';
import { CreateEvent } from '@/pages/CreateEvent';
import { EventDetails } from '@/pages/EventDetails';
import { Register } from '@/pages/Register';
import { RegistrationSuccess } from '@/pages/RegistrationSuccess';
import { OrganizerLogin } from '@/pages/OrganizerLogin';
import { Dashboard } from '@/pages/Dashboard';
import { ScanAttendance } from '@/pages/ScanAttendance';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* ── Public routes ─────────────────────────────────── */}
          <Route index element={<Home />} />
          <Route path="create-event" element={<CreateEvent />} />
          <Route path="organizer-login" element={<OrganizerLogin />} />

          {/* Registration is accessible via direct URL (link shared by organizer)
              but is intentionally not linked anywhere in the public UI. */}
          <Route path="register/:eventId" element={<Register />} />
          <Route path="registration-success/:eventId/:teamId" element={<RegistrationSuccess />} />

          {/* ── Protected routes (organizer login required) ────── */}
          <Route
            path="event-details/:eventId"
            element={<ProtectedRoute><EventDetails /></ProtectedRoute>}
          />
          <Route
            path="dashboard/:eventId"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="scan/:eventId"
            element={<ProtectedRoute><ScanAttendance /></ProtectedRoute>}
          />

          {/* Team lookup is now embedded inside Dashboard — redirect stale links */}
          <Route path="team-lookup" element={<Navigate to="/organizer-login" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
