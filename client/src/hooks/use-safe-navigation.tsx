import { useLocation } from "wouter";

export const useSafeNavigation = () => {
  const [location, navigate] = useLocation();

  const safeNavigate = (path: string) => {
    // Remove any double slashes and clean the path
    const cleanPath = path.replace(/\/+/g, '/').replace(/^https?:\/\/[^/]+/, '');
    navigate(cleanPath);
  };

  return [location, safeNavigate] as const;
};