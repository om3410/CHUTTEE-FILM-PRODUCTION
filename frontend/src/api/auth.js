import client from './client';

export const authenticate = async (username, password) => {
  const { data: tokens } = await client.post('/token/', { username, password });
  const { data: user } = await client.get('/auth/api/me/', {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });
  return { token: tokens.access, user };
};

export const updateProfile = async (profile) => {
  const { data } = await client.patch('/auth/api/me/', profile);
  return data;
};

export const requestAccountRecovery = async (email) => {
  const { data } = await client.post('/auth/api/account-recovery/', { email });
  return data;
};

export const confirmPasswordReset = async (uid, token, password, password2) => {
  const { data } = await client.post('/auth/api/password-reset/confirm/', {
    uid,
    token,
    password,
    password2,
  });
  return data;
};

export const registerAndAuthenticate = async ({ name, email, password }) => {
  const [firstName, ...lastName] = name.trim().split(/\s+/);
  const username = email.split('@')[0].toLowerCase();
  await client.post('/auth/api/register/', {
    username,
    email,
    password,
    password2: password,
    first_name: firstName,
    last_name: lastName.join(' '),
  });
  return authenticate(username, password);
};

export const getApiErrorMessage = (error, fallback) => {
  const responseData = error.response?.data;
  if (typeof responseData === 'string') return responseData;
  if (responseData && typeof responseData === 'object') {
    for (const value of Object.values(responseData)) {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    }
  }
  return error.message || fallback;
};
