import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface HomePathContextType {
  homePath: string;
  isPragathiContext: boolean;
  getHomePath: () => string;
  getRoutePath: (path: string) => string;
}

const STORAGE_KEY = 'pragathi_home_path';

const HomePathContext = createContext<HomePathContextType>({
  homePath: '/',
  isPragathiContext: false,
  getHomePath: () => '/',
  getRoutePath: (path: string) => path,
});

export const HomePathProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isPragathiContext = location.pathname.startsWith('/pragathi-2.0');
  const homePath = isPragathiContext ? '/pragathi-2.0' : '/';

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, homePath);
  }, [homePath]);

  const getHomePath = () => homePath;

  const getRoutePath = (path: string) => {
    if (!path) return path;

    // If path is an external link or hash-only, handle appropriately
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('mailto:')) {
      return path;
    }

    // If path already starts with /pragathi-2.0, keep it as is
    if (path.startsWith('/pragathi-2.0')) {
      return path;
    }

    if (isPragathiContext) {
      if (path === '/') return '/pragathi-2.0';
      if (path.startsWith('/#')) return `/pragathi-2.0${path.substring(1)}`;
      if (path.startsWith('/')) return `/pragathi-2.0${path}`;
    }

    return path;
  };

  return (
    <HomePathContext.Provider value={{ homePath, isPragathiContext, getHomePath, getRoutePath }}>
      {children}
    </HomePathContext.Provider>
  );
};

export const useHomePath = () => useContext(HomePathContext);
