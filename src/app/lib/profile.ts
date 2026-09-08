'use client';

import { useState, useEffect } from 'react';

export interface ProfileData {
  namaUstadz: string;
  namaMdta: string;
}

const DEFAULT_PROFILE: ProfileData = {
  namaUstadz: 'Ustadz Ahmad Farhan, S.Pd.I',
  namaMdta: 'MDTA Al-Hikmah',
};

const STORAGE_KEY = 'mdta_profile_data';
const EVENT_NAME = 'mdta_profile_updated';

export function getProfile(): ProfileData {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read profile', e);
  }
  return DEFAULT_PROFILE;
}

export function saveProfile(profile: ProfileData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);

  useEffect(() => {
    setProfile(getProfile());

    const handleUpdate = () => {
      setProfile(getProfile());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return { profile, updateProfile: saveProfile };
}
