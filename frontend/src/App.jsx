import {Route, Routes} from 'react-router-dom'

import HomePage from './pages/home/HomePage';
import SignUpPage from './pages/auth/signup/SignUpPage';
import LoginPage from './pages/auth/login/LoginPage';
import NotificationPage from './pages/notifications/NotificationsPage';
import ProfilePage from './pages/profile/ProfilePage';
import PostDetailPage from './pages/post/PostDetailPage';
import BookmarksPage from './pages/bookmarks/BookmarksPage';
import SearchPage from './pages/search/SearchPage';
import MessagesPage from './pages/messages/MessagesPage';
import { Navigate } from 'react-router-dom';

import Sidebar from './components/common/Sidebar';
import MobileNav from './components/common/MobileNav';
import RightPanel from './components/common/RightPanel';
import ComposeModal from './components/common/ComposeModal';
import SettingsModal from './components/common/SettingsModal';
import { ThemeProvider } from './context/ThemeContext';
import NestPanel from './components/nest/NestPanel';

import {Toaster} from "react-hot-toast";
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './components/common/LoadingSpinner';

function AppContent() {
  const { data: authUser, isLoading } = useQuery({
    queryKey : ["authUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch authenticated user");
      }
      return data;
    },
    retry: false,
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });

if(isLoading){
    return(
      <div className='h-screen flex justify-center items-center'>
        <LoadingSpinner size='lg' />
      </div>
    )
  }

  if (!authUser) {
    return (
      <>
        <Routes>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/signup' element={<SignUpPage />} />
          <Route path='*' element={<Navigate to="/login" />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className='flex w-full min-h-screen'>
        <Sidebar />
        <div className='flex flex-1 min-w-0 flex-col'>
          <MobileNav />
          <div className='flex flex-1 min-w-0'>
          <main className='flex-1 min-w-0 w-full lg:max-w-[600px] lg:border-r border-theme safe-bottom lg:pb-0'>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/search' element={<SearchPage />} />
              <Route path='/messages' element={<MessagesPage />} />
              <Route path='/notifications' element={<NotificationPage />} />
              <Route path='/bookmarks' element={<BookmarksPage />} />
              <Route path='/post/:id' element={<PostDetailPage />} />
              <Route path='/profile/:username' element={<ProfilePage />} />
              <Route path='*' element={<Navigate to="/" />} />
            </Routes>
          </main>
          <RightPanel />
          </div>
        </div>
      </div>
      <ComposeModal />
      <SettingsModal />
      <NestPanel />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App
