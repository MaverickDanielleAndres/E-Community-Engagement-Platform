// @/app/main/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeContext';

export default function MainPage() {
  const { data: session, status } = useSession();
  const { themeClasses } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToRoleDashboard = async () => {
      if (status === 'loading') return;
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      try {
        // Fetch user role from API
        const response = await fetch('/api/me/role');
        const data = await response.json();
        const userRole = data.role || 'Guest';

        // Redirect based on role
        switch (userRole) {
          case 'Admin':
            router.push('/main/admin');
            break;
          case 'Resident':
            router.push('/main/user');
            break;
          default:
            router.push('/main/guest');
            break;
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Default to guest if error
        router.push('/main/guest');
      } finally {
        setIsLoading(false);
      }
    };

    redirectToRoleDashboard();
  }, [session, status, router]);

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${themeClasses.text}`}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}