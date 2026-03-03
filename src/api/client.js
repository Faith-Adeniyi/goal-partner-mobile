import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let authToken = null;
let unauthorizedHandler = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler || null;
};

const normalizeBaseUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  return url.trim().replace(/\/+$/, '');
};

const getExpoHostUri = () =>
  Constants.expoConfig?.hostUri ||
  Constants.expoGoConfig?.debuggerHost ||
  Constants.manifest2?.extra?.expoClient?.hostUri ||
  Constants.manifest?.debuggerHost;

const buildBaseUrlCandidates = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const appExtraUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  const expoHostUri = getExpoHostUri();
  const urls = [];

  const pushCandidate = (value) => {
    const normalized = normalizeBaseUrl(value);
    if (normalized && !urls.includes(normalized)) urls.push(normalized);
  };

  pushCandidate(envUrl);

  if (expoHostUri) {
    const host = expoHostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      pushCandidate(`http://${host}:8000`);
    }
  }

  pushCandidate(appExtraUrl);

  if (Platform.OS === 'android') {
    pushCandidate('http://10.0.2.2:8000');
  }

  pushCandidate('http://127.0.0.1:8000');
  pushCandidate('http://localhost:8000');

  return urls;
};

const baseUrlCandidates = buildBaseUrlCandidates();
let activeBaseUrl = baseUrlCandidates[0] || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: activeBaseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const setActiveBaseUrl = (baseUrl) => {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) return;
  activeBaseUrl = normalized;
  apiClient.defaults.baseURL = normalized;
};

const isNetworkError = (error) => !error?.response && !!error?.message;

const requestWithFallback = async (requestFactory) => {
  try {
    return await requestFactory();
  } catch (firstError) {
    if (!isNetworkError(firstError)) {
      throw firstError;
    }

    let lastError = firstError;
    for (const candidate of baseUrlCandidates) {
      if (candidate === activeBaseUrl) continue;
      setActiveBaseUrl(candidate);

      try {
        return await requestFactory();
      } catch (nextError) {
        lastError = nextError;
        if (!isNetworkError(nextError)) {
          throw nextError;
        }
      }
    }

    throw lastError;
  }
};

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path = error?.config?.url || '';
    const isAuthEndpoint =
      path.includes('/auth/login') ||
      path.includes('/auth/signup');

    if (status === 401 && !isAuthEndpoint && typeof unauthorizedHandler === 'function') {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

const toSuccess = (data) => ({ success: true, data, error: null });
const toFailure = (error, fallbackMessage) => {
  if (isNetworkError(error)) {
    return {
      success: false,
      data: null,
      error: `Network Error: unable to reach API at ${activeBaseUrl}. Ensure backend is running and reachable from this device.`,
    };
  }

  const message =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;
  return { success: false, data: null, error: message };
};

export const signUp = async (fullName, email, password) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.post('/auth/signup', {
        full_name: fullName,
        email,
        password,
      })
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Unable to create account.');
  }
};

export const login = async (email, password) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.post('/auth/login', { email, password })
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Invalid email or password.');
  }
};

export const getMe = async () => {
  try {
    const response = await requestWithFallback(() => apiClient.get('/auth/me'));
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Session expired. Please sign in again.');
  }
};

export const fetchActiveGoals = async () => {
  try {
    const response = await requestWithFallback(() => apiClient.get('/goals'));
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to load your goals.');
  }
};

export const submitDailyCheckin = async (planId, checkinData) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.post(`/goals/${planId}/checkin`, checkinData)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to save check-in.');
  }
};

export const sendChatMessage = async (messageText, goalId) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.post('/chat', {
        goal_id: goalId || 'general',
        message: messageText,
      })
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Unable to reach coach right now.');
  }
};

export const submitWeeklyReview = async (planId, reviewData) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.post(`/goals/${planId}/weekly-review`, reviewData)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to submit weekly review.');
  }
};

export const fetchGoalDetails = async (planId) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.get(`/goals/${planId}`)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to load goal details.');
  }
};

export const toggleTaskStatus = async (planId, milestoneId, taskId) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.patch(`/goals/${planId}/check/${milestoneId}/${taskId}`)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to update task.');
  }
};

export const sendCoachMessage = async (planId, message, history, energy) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.post(`/goals/${planId}/coach`, {
        user_message: message,
        energy_level: energy,
        chat_history: history,
      })
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Coach is currently unavailable.');
  }
};

export default apiClient;
