import { useEffect, useState } from 'react';
import axios from 'axios';
import { baseURL } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { decodeUserFromToken } from '../lib/jwt';

/** Access tokens live only in memory, so a hard refresh loses them. On first
 * load we try the refreshToken cookie once to silently restore the session. */
export function useSessionBootstrap() {
  const [ready, setReady] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    axios
      .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token = res.data?.accessToken;
        const user = token ? decodeUserFromToken(token) : null;
        if (token && user) setSession(token, user);
      })
      .catch(() => {
        // No valid refresh cookie — not logged in, that's fine
      })
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ready;
}
