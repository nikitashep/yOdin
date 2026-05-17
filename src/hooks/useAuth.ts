import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const { firebaseUser, profile, isLoading, setFirebaseUser, setProfile, setLoading, reset } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const p = await getUserProfile(user.uid);
        setProfile(p);
      } else {
        reset();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user: firebaseUser, profile, isLoading };
}
