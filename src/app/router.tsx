import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, useRouteError } from 'react-router-dom';
import { ErrorState, LoadingState, NotFoundState } from '@/components/StatePanels';
import AssessPage from '@/pages/AssessPage';
import DashboardPage from '@/pages/DashboardPage';
import LearnPage from '@/pages/LearnPage';
import ModulePage from '@/pages/ModulePage';
import QuestPage from '@/pages/QuestPage';
import QuestsPage from '@/pages/QuestsPage';
import WelcomePage from '@/pages/WelcomePage';
import AppShell from './AppShell';
import RootLayout from './RootLayout';

// Heavier screens are split out: lab (diagram + 3D), progress (charts), settings, design reference.
const LabIndexPage = lazy(() => import('@/pages/LabIndexPage'));
const InclineLabPage = lazy(() => import('@/pages/InclineLabPage'));
const PulleyLabPage = lazy(() => import('@/pages/PulleyLabPage'));
const ProgressPage = lazy(() => import('@/pages/ProgressPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const DesignPage = lazy(() => import('@/pages/DesignPage'));
const TeacherPage = lazy(() => import('@/pages/TeacherPage'));

const lazyPage = (node: ReactNode) => <Suspense fallback={<LoadingState />}>{node}</Suspense>;

function RouteError() {
  const error = useRouteError();
  return (
    <div className="p-6">
      <ErrorState
        message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/welcome', element: <WelcomePage /> },
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'learn', element: <LearnPage /> },
          { path: 'learn/:moduleId', element: <ModulePage /> },
          { path: 'lab', element: lazyPage(<LabIndexPage />) },
          { path: 'lab/incline', element: lazyPage(<InclineLabPage />) },
          { path: 'lab/pulley', element: lazyPage(<PulleyLabPage />) },
          { path: 'quests', element: <QuestsPage /> },
          { path: 'quests/:questId', element: <QuestPage /> },
          { path: 'assess', element: <AssessPage /> },
          { path: 'progress', element: lazyPage(<ProgressPage />) },
          { path: 'settings', element: lazyPage(<SettingsPage />) },
          { path: 'design', element: lazyPage(<DesignPage />) },
          { path: 'teacher', element: lazyPage(<TeacherPage />) },
          { path: '*', element: <NotFoundState /> },
        ],
      },
    ],
  },
]);
