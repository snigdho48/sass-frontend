import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from './useAppSelector';
import { setNavigationLoading } from '../store/slices/uiSlice';

export const useNavigationLoading = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Set navigation loading when route changes
    dispatch(setNavigationLoading(true));
    
    // Simulate loading time for smooth transitions
    const timer = setTimeout(() => {
      dispatch(setNavigationLoading(false));
    }, 300); // Reduced from 500ms for faster feel

    return () => clearTimeout(timer);
  }, [location.pathname, dispatch]);
}; 