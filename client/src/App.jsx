import Background from "./components/Background";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Stories from "./pages/Stories";
import StoryDetails from "./pages/StoryDetails";
import AI from "./pages/AI";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Quran from "./pages/Quran";
import SurahDetails from "./pages/SurahDetails";

import ProtectedRoute from "./components/Auth/ProtectedRoute";
import CompleteProfileForm from "./components/Auth/CompleteProfileForm";
import { AuthProvider } from "./context/AuthContext";

// Admin
import AdminLogin from "./admin/AdminLogin";
import AdminRoute from "./admin/AdminRoute";
import AdminDashboard from "./admin/AdminDashboard";
import AdminStories from "./admin/AdminStories";
import AdminStoryDetail from "./admin/AdminStoryDetail";
import AdminUsers from "./admin/AdminUsers";
import AdminUserDetail from "./admin/AdminUserDetail";
import AdminChatLogs from "./admin/AdminChatLogs";

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/admin-login';
  const isAdminPage = location.pathname.startsWith('/admin') && location.pathname !== '/admin-login';

  if (isAdminPage) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="stories" element={<AdminStories />} />
          <Route path="stories/:storyId" element={<AdminStoryDetail />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetail />} />
          <Route path="chat-logs" element={<AdminChatLogs />} />
        </Route>
      </Routes>
    );
  }

  return (
    <>
      <Background />

      <div className="relative z-10 pb-24">
        {!isAuthPage && <Navbar />}

        <Routes>
          {/* Protected Main Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
          <Route path="/story/:id" element={<ProtectedRoute><StoryDetails /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AI /></ProtectedRoute>} />
          <Route path="/ai/:storyId" element={<ProtectedRoute><AI /></ProtectedRoute>} />
          <Route path="/quiz/:storyId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />

          {/* Quran */}
          <Route path="/quran" element={<ProtectedRoute><Quran /></ProtectedRoute>} />
          <Route path="/quran/:id" element={<ProtectedRoute><SurahDetails /></ProtectedRoute>} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <div className="pt-20 px-4 pb-32">
                  <CompleteProfileForm />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>

        {!isAuthPage && <BottomNav />}
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;