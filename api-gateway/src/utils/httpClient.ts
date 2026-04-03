import axios from "axios";
import axiosRetry from "axios-retry";

export const httpClient = axios.create({
  timeout: 10000, // 10 seconds timeout
});

// Configure retry mechanism
axiosRetry(httpClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status && error.response.status >= 500);
  },
});
