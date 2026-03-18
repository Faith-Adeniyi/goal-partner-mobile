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

  // Prefer explicit app.json config first (works for physical devices too)
  pushCandidate(appExtraUrl);

  // Then environment override (useful for CI / local overrides)
  pushCandidate(envUrl);

  if (expoHostUri) {
    const host = expoHostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      pushCandidate(`http://${host}:8000`);
    }
  }

  if (Platform.OS === 'android') {
    pushCandidate('http://10.0.2.2:8000');
  }

  // Only useful for web / local dev; physical devices won't reach your PC with localhost/127.
  pushCandidate('http://127.0.0.1:8000');
  pushCandidate('http://localhost:8000');

  return urls;
};

const baseUrlCandidates = buildBaseUrlCandidates();

// HARD REQUIREMENT: if app.json sets extra.apiBaseUrl, we must use it (physical devices can't use localhost).
const configuredBaseUrl = normalizeBaseUrl(Constants.expoConfig?.extra?.apiBaseUrl);
let activeBaseUrl = configuredBaseUrl || baseUrlCandidates[0] || 'http://127.0.0.1:8000';

if (!configuredBaseUrl) {
  console.warn(
    '[api] Missing Constants.expoConfig.extra.apiBaseUrl; physical devices will not reach localhost/127. Check app.json and restart Expo.'
  );
}

export const getActiveBaseUrl = () => activeBaseUrl;

export const pingApi = async () => {
  try {
    const response = await requestWithFallback(() => apiClient.get('/'));
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Unable to reach backend.');
  }
};

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

      console.warn('[api] Network error, retrying with baseURL candidate:', {
        from: activeBaseUrl,
        to: candidate,
      });

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
      status: null,
      raw: null,
    };
  }

  const status = error?.response?.status ?? null;
  const raw = error?.response?.data ?? null;
  const detail = error?.response?.data?.detail;
  const messageField = error?.response?.data?.message;

  // FastAPI validation errors can come back as an array of objects:
  // [{ type, loc, msg, input, ctx }, ...]
  if (Array.isArray(detail)) {
    const firstMsg = detail.find((item) => typeof item?.msg === 'string')?.msg;
    const summarized =
      firstMsg ||
      detail
        .map((item) => (typeof item?.msg === 'string' ? item.msg : null))
        .filter(Boolean)
        .join('\n');

    return {
      success: false,
      data: null,
      error: summarized || fallbackMessage,
      status,
      raw,
    };
  }

  // Sometimes servers return detail as an object (also not renderable in React)
  if (detail && typeof detail === 'object') {
    return {
      success: false,
      data: null,
      error: fallbackMessage,
      status,
      raw,
    };
  }

  const message =
    (typeof detail === 'string' ? detail : null) ||
    (typeof messageField === 'string' ? messageField : null) ||
    error?.message ||
    fallbackMessage;

  return { success: false, data: null, error: message, status, raw };
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

export const sendChatMessage = async (messageInput, goalId) => {
  const normalizedPayload =
    typeof messageInput === 'string'
      ? {
          goal_id: goalId || 'general',
          message: messageInput.trim(),
        }
      : {
          goal_id: messageInput?.goalId || 'general',
          message: (messageInput?.message || '').trim(),
          mode: messageInput?.mode || 'assistant',
          chat_history: Array.isArray(messageInput?.history) ? messageInput.history : [],
        };

  if (!normalizedPayload.message) {
    return { success: false, data: null, error: 'Please enter a message first.', status: null, raw: null };
  }

  try {
    const response = await requestWithFallback(() =>
      apiClient.post('/chat', normalizedPayload)
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

export const deleteGoal = async (planId) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.delete(`/goals/${planId}`)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to delete goal.');
  }
};

export const fetchGoalStreak = async (planId) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.get(`/goals/${planId}/streak`)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to load streak.');
  }
};

export const updateGoalMeta = async (planId, meta) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.patch(`/goals/${planId}/meta`, meta)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to update goal.');
  }
};

export const addMilestoneTask = async (planId, milestoneId, payload) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.post(`/goals/${planId}/milestones/${milestoneId}/tasks`, payload)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to add task.');
  }
};

export const updateMilestoneTask = async (planId, milestoneId, taskId, payload) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.patch(`/goals/${planId}/milestones/${milestoneId}/tasks/${taskId}`, payload)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to update task.');
  }
};

export const deleteMilestoneTask = async (planId, milestoneId, taskId) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.delete(`/goals/${planId}/milestones/${milestoneId}/tasks/${taskId}`)
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to delete task.');
  }
};

export const reorderMilestoneTasks = async (planId, milestoneId, orderedTaskIds) => {
  try {
    const response = await requestWithFallback(() =>
      apiClient.post(`/goals/${planId}/milestones/${milestoneId}/tasks/reorder`, {
        ordered_task_ids: orderedTaskIds,
      })
    );
    return toSuccess(response.data);
  } catch (error) {
    return toFailure(error, 'Failed to reorder tasks.');
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
