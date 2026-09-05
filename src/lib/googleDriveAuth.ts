import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem('gdrive_access_token');
  } catch (e) {
    return null;
  }
})();

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  const token = cachedAccessToken;
  let cachedUser = null;
  try {
    const savedUser = localStorage.getItem('gdrive_user_info');
    if (savedUser) {
      cachedUser = JSON.parse(savedUser);
    }
  } catch (e) {}

  if (token && cachedUser) {
    if (onAuthSuccess) {
      onAuthSuccess(cachedUser, token);
    }
  } else if (token) {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(info => {
        const mockUser = {
          displayName: info.name || info.given_name || 'Akun Google',
          email: info.email || '',
          photoURL: info.picture || null,
          uid: info.sub || 'gdrive-user'
        };
        try {
          localStorage.setItem('gdrive_user_info', JSON.stringify(mockUser));
        } catch (e) {}
        if (onAuthSuccess) onAuthSuccess(mockUser, token);
      })
      .catch(() => {
        const fallbackUser = {
          displayName: 'Akun Google',
          email: 'workspace@school.sch.id',
          photoURL: null,
          uid: 'gdrive-user'
        };
        if (onAuthSuccess) onAuthSuccess(fallbackUser, token);
      });
  } else {
    if (onAuthFailure) onAuthFailure();
  }

  // Return unsubscribe dummy
  return () => {};
};

// Handle standard Google Identity Services token client popup flow
export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    const errorMsg = 'Google Client ID (VITE_GOOGLE_CLIENT_ID) tidak ditemukan di environment variables. Silakan hubungi Administrator atau tambahkan ke pengaturan .env.';
    alert(errorMsg);
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google) {
      const errorMsg = 'Google SDK belum siap dimuat di halaman. Harap tunggu beberapa saat atau muat ulang halaman ini.';
      alert(errorMsg);
      return reject(new Error(errorMsg));
    }

    try {
      isSigningIn = true;
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
        ux_mode: 'popup',
        callback: async (response: any) => {
          isSigningIn = false;
          if (response.error) {
            console.error('Google OAuth2 error response:', response);
            alert(`Gagal Otorisasi: ${response.error_description || response.error}`);
            return reject(new Error(response.error_description || response.error));
          }

          if (response.access_token) {
            const token = response.access_token;
            cachedAccessToken = token;
            try {
              localStorage.setItem('gdrive_access_token', token);
            } catch (e) {}

            try {
              const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (uRes.ok) {
                const info = await uRes.json();
                const mockUser = {
                  displayName: info.name || info.given_name || 'Akun Google',
                  email: info.email || '',
                  photoURL: info.picture || null,
                  uid: info.sub || 'gdrive-user'
                };
                try {
                  localStorage.setItem('gdrive_user_info', JSON.stringify(mockUser));
                } catch (e) {}
                resolve({ user: mockUser, accessToken: token });
              } else {
                throw new Error('Userinfo status failed');
              }
            } catch (err) {
              console.warn('Could not fetch real userinfo, using fallback profile:', err);
              const fallbackUser = {
                displayName: 'Akun Google',
                email: 'workspace@school.sch.id',
                photoURL: null,
                uid: 'gdrive-user'
              };
              resolve({ user: fallbackUser, accessToken: token });
            }
          } else {
            reject(new Error('Gagal mendapatkan token akses Google.'));
          }
        },
        error_callback: (err: any) => {
          isSigningIn = false;
          console.error('Google OAuth Popup error:', err);
          alert('Proses masuk Google dibatalkan atau pop-up diblokir oleh browser Anda. Mohon izinkan pop-up.');
          reject(err);
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      isSigningIn = false;
      console.error('Failed to initTokenClient:', err);
      reject(err);
    }
  });
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setManualAccessToken = async (token: string): Promise<{ user: any; accessToken: string }> => {
  cachedAccessToken = token;
  try {
    localStorage.setItem('gdrive_access_token', token);
  } catch (e) {}
  
  try {
    const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (uRes.ok) {
      const info = await uRes.json();
      const mockUser = {
        displayName: info.name || info.given_name || 'Akun Google (Manual)',
        email: info.email || '',
        photoURL: info.picture || null,
        uid: info.sub || 'gdrive-user'
      };
      try {
        localStorage.setItem('gdrive_user_info', JSON.stringify(mockUser));
      } catch (e) {}
      return { user: mockUser, accessToken: token };
    } else {
      throw new Error('Userinfo status failed');
    }
  } catch (err) {
    console.warn('Could not fetch real userinfo for manual token, using fallback:', err);
    const fallbackUser = {
      displayName: 'Akun Google (Manual)',
      email: 'workspace@school.sch.id',
      photoURL: null,
      uid: 'gdrive-user'
    };
    try {
      localStorage.setItem('gdrive_user_info', JSON.stringify(fallbackUser));
    } catch (e) {}
    return { user: fallbackUser, accessToken: token };
  }
};

export const googleSignOut = async () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem('gdrive_access_token');
    localStorage.removeItem('gdrive_user_info');
  } catch (e) {}
};
