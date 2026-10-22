import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {hasSession, storedUser} from '../utils/session';

const ProtectedRoute = ({ children, role = 'admin' }) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const authenticated = role === 'admin' ? isLoggedIn && hasSession('admin') : hasSession() && storedUser();

  return authenticated ? children : <Navigate to={role === 'admin' ? '/admin/login' : '/login'} state={{from:location}} replace />;
};

export default ProtectedRoute;
