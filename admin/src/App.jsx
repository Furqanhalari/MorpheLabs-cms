import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import PostList     from './pages/blog/PostList';
import PostForm     from './pages/blog/PostForm';
import Categories   from './pages/blog/Categories';
import ServiceList  from './pages/services/ServiceList';
import ServiceForm  from './pages/services/ServiceForm';
import PortfolioList from './pages/services/PortfolioList';
import PortfolioForm from './pages/services/PortfolioForm';
import JobList      from './pages/careers/JobList';
import JobForm      from './pages/careers/JobForm';
import Applications from './pages/careers/Applications';
import MediaLibrary from './pages/MediaLibrary';
import UserList     from './pages/UserList';
import AuditLog     from './pages/AuditLog';

// ── Theme matching MorpheLabs brand ──────────────────────────────────────────
const theme = {
  token: {
    colorPrimary:   '#00B4D8',
    colorLink:      '#00B4D8',
    borderRadius:    6,
    fontFamily:     '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index               element={<Dashboard />} />
        {/* Blog */}
        <Route path="blog/posts"   element={<PostList />} />
        <Route path="blog/posts/new"   element={<PostForm />} />
        <Route path="blog/posts/:id"   element={<PostForm />} />
        <Route path="blog/categories"  element={<Categories />} />
        {/* Services */}
        <Route path="services"         element={<ServiceList />} />
        <Route path="services/new"     element={<ServiceForm />} />
        <Route path="services/:id"     element={<ServiceForm />} />
        <Route path="services/portfolio"       element={<PortfolioList />} />
        <Route path="services/portfolio/new"   element={<PortfolioForm />} />
        <Route path="services/portfolio/:id"   element={<PortfolioForm />} />
        {/* Careers */}
        <Route path="careers"          element={<JobList />} />
        <Route path="careers/new"      element={<JobForm />} />
        <Route path="careers/:id"      element={<JobForm />} />
        <Route path="careers/:id/applications" element={<Applications />} />
        {/* Other */}
        <Route path="media"            element={<MediaLibrary />} />
        <Route path="users"            element={<UserList />} />
        <Route path="audit"            element={<AuditLog />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
