import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';

// Core entry routes (eagerly loaded for sub-second first paint)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Lazy-loaded routes (chunked on-demand, isolating heavy Admin & Editor bundles)
const NotesPage = lazy(() => import('./pages/NotesPage'));
const NoteEditorPage = lazy(() => import('./pages/NoteEditorPage'));
const NoteDetailPage = lazy(() => import('./pages/NoteDetailPage'));
const KaraokeNoteReader = lazy(() => import('./pages/KaraokeNoteReader'));

const VideosPage = lazy(() => import('./pages/VideosPage'));
const VideoDetailPage = lazy(() => import('./pages/VideoDetailPage'));
const VideoFormPage = lazy(() => import('./pages/VideoFormPage'));

const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const QuizFormPage = lazy(() => import('./pages/QuizFormPage'));
const QuizTakePage = lazy(() => import('./pages/QuizTakePage'));
const QuizReviewPage = lazy(() => import('./pages/QuizReviewPage'));

const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'));
const FlashcardFormPage = lazy(() => import('./pages/FlashcardFormPage'));
const StudyPage = lazy(() => import('./pages/StudyPage'));

const LingoDolphyPage = lazy(() => import('./pages/LingoDolphyPage'));
const CurriculumPage = lazy(() => import('./pages/CurriculumPage'));

const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminPagesPage = lazy(() => import('./pages/AdminPagesPage'));
const AdminNotificationsPage = lazy(() => import('./pages/AdminNotificationsPage'));
const PageEditorPage = lazy(() => import('./pages/PageEditorPage'));
const PublicPageView = lazy(() => import('./pages/PublicPageView'));

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ActivityHistoryPage = lazy(() => import('./pages/ActivityHistoryPage'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-400">Loading page...</span>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const isQuizTake = location.pathname.includes('/take');
  
  return (
    <div className={isQuizTake ? "min-h-screen" : "pt-24 min-h-screen"}>
      {!isQuizTake && <Navbar />}
      <main className={isQuizTake ? "pb-0" : "pb-12"}>
        <Suspense fallback={<PageFallback />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

      <Route path="/notes" element={<ProtectedRoute><Layout><NotesPage /></Layout></ProtectedRoute>} />
      <Route path="/notes/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><NoteEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/notes/karaoke/demo" element={<ProtectedRoute><Layout><KaraokeNoteReader /></Layout></ProtectedRoute>} />
      <Route path="/notes/:id" element={<ProtectedRoute><Layout><NoteDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/notes/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><NoteEditorPage /></Layout></ProtectedRoute>} />

      <Route path="/videos" element={<ProtectedRoute><Layout><VideosPage /></Layout></ProtectedRoute>} />
      <Route path="/videos/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><VideoFormPage /></Layout></ProtectedRoute>} />
      <Route path="/videos/:id" element={<ProtectedRoute><Layout><VideoDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/videos/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><VideoFormPage /></Layout></ProtectedRoute>} />

      <Route path="/quizzes" element={<ProtectedRoute><Layout><QuizzesPage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><QuizFormPage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><QuizFormPage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/:id/take" element={<ProtectedRoute><Layout><QuizTakePage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/:id/review" element={<ProtectedRoute><Layout><QuizReviewPage /></Layout></ProtectedRoute>} />

      <Route path="/flashcards" element={<ProtectedRoute><Layout><FlashcardsPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><FlashcardFormPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><FlashcardFormPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards/:id/study" element={<ProtectedRoute><Layout><StudyPage /></Layout></ProtectedRoute>} />
      <Route path="/lingodolphy" element={<ProtectedRoute roles={['student']}><Layout><LingoDolphyPage /></Layout></ProtectedRoute>} />

      <Route path="/lessons" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><CurriculumPage /></Layout></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin']}><Layout><AdminNotificationsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/pages" element={<ProtectedRoute roles={['admin']}><Layout><AdminPagesPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/pages/new" element={<ProtectedRoute roles={['admin']}><Layout><PageEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/pages/:id/edit" element={<ProtectedRoute roles={['admin']}><Layout><PageEditorPage /></Layout></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

      <Route path="/activity" element={<ProtectedRoute><Layout><ActivityHistoryPage /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<Navigate to="/activity" replace />} />

      {/* Public Custom Dynamic Page URL (accessible to everyone) */}
      <Route path="/:slug" element={<Layout><PublicPageView /></Layout>} />

      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center text-center">
          <div>
            <div className="text-8xl mb-4">🚀</div>
            <h1 className="text-4xl font-bold text-white mb-2">404</h1>
            <p className="text-gray-500 mb-6">Page not found</p>
            <a href="/" className="btn-primary inline-flex">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              color: '#f3f4f6',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
