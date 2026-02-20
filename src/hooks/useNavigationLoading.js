import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setNavigationLoading } from '../store/slices/uiSlice';

export const useNavigationLoading = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setNavigationLoading(true));
    const timer = setTimeout(() => dispatch(setNavigationLoading(false)), 300);
    return () => clearTimeout(timer);
  }, [location.pathname, dispatch]);
}; 