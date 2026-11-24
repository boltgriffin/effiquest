import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, useRouteError } from 'react-router-dom';
import { ErrorState, LoadingState, NotFoundState } from '@/components/StatePanels';
import AssessPage from '@/pages/AssessPage';
import DiagnosticPage from '@/pages/DiagnosticPage';
import DashboardPage from '@/pages/DashboardPage';
import LearnPage from '@/pages/LearnPage';
import QuestCheckPage from '@/pages/QuestCheckPage';
import QuestPage from '@/pages/QuestPage';
import QuestsPage from '@/pages/QuestsPage';
import AppShell from './AppShell';
import RootLayout from './RootLayout';

// Heavier screens are split out: welcome (3D showcase), lesson text, lab (diagram + 3D), progress
// (charts), settings, design reference.
const WelcomePage = lazy(() => import('@/pages/WelcomePage'));
const ModulePage = lazy(() => import('@/pages/ModulePage'));
const LabIndexPage = lazy(() => import('@/pages/LabIndexPage'));
const MachineLabPage = lazy(() => import('@/pages/MachineLabPage'));
const LabComparePage = lazy(() => import('@/pages/LabComparePage'));
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
      { path: '/welcome', element: lazyPage(<WelcomePage />) },
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'learn', element: <LearnPage /> },
          { path: 'learn/:moduleId', element: lazyPage(<ModulePage />) },
          { path: 'lab', element: lazyPage(<LabIndexPage />) },
          { path: 'lab/compare', element: lazyPage(<LabComparePage />) },
          { path: 'lab/:machineId', element: lazyPage(<MachineLabPage />) },
          { path: 'quests', element: <QuestsPage /> },
          { path: 'quests/:questId', element: <QuestPage /> },
          { path: 'quests/:questId/check', element: <QuestCheckPage /> },
          { path: 'assess', element: <AssessPage /> },
          { path: 'assess/:kind', element: <DiagnosticPage /> },
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
