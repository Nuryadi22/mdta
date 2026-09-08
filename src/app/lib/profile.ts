'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProfile as fetchProfile, updateProfile as saveProfileServer, ProfileData } from '@/app/actions/profile';

export type { ProfileData };

const DEFAULT_PROFILE: ProfileData = {
  namaUstadz: 'Nuryadi',
  namaMdta: 'MDTA Al-Istikmal',
};

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch (e) {
      console.error('Failed to load profile from database', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (newProfile: ProfileData) => {
    setProfile(newProfile);
    try {
      await saveProfileServer(newProfile);
    } catch (e) {
      console.error('Failed to save profile to database', e);
    }
  };

  return { profile, updateProfile, isLoading, refreshProfile: loadProfile };
}
