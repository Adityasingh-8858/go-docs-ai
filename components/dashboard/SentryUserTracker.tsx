'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';

const SentryUserTracker = () => {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username || user.fullName || undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  return null; // This component does not render anything
};

export default SentryUserTracker;
