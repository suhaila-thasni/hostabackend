import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, defaultHeaders } from "./config";



export const options = {
  scenarios: {

    // 1️⃣ LOAD TEST (normal users)
    load_test: {
      executor: "ramping-vus",
      stages: [
        { duration: "1m", target: 50 },
        { duration: "2m", target: 200 },
        { duration: "1m", target: 0 },
      ],
    },

    // 2️⃣ STRESS TEST (breaking point)
    stress_test: {
      executor: "ramping-vus",
      startTime: "5m",
      stages: [
        { duration: "1m", target: 500 },
        { duration: "2m", target: 1000 },
        { duration: "1m", target: 2000 },
        { duration: "1m", target: 0 },
      ],
    },

    // 3️⃣ SPIKE TEST (sudden traffic)
    spike_test: {
      executor: "ramping-vus",
      startTime: "10m",
      stages: [
        { duration: "10s", target: 50 },
        { duration: "20s", target: 2000 },
        { duration: "20s", target: 50 },
      ],
    },

    // 4️⃣ SOAK TEST (long running stability)
    soak_test: {
      executor: "constant-vus",
      startTime: "15m",
      vus: 200,
      duration: "30m",
    },
  },
};

export default function () {
  const payload = JSON.stringify({
    email: "test@gmail.com",
    password: "123456",
  });

  const res = http.post(
    `${BASE_URL}/api/login`,
    payload,
    {
      headers: defaultHeaders,
    }
  );

  check(res, {
    "login success": (r) => r.status === 200,
    "response < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}