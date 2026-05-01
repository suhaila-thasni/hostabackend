import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL } from "./config";

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
  const token = "YOUR_TEST_TOKEN";

  const payload = JSON.stringify({
    patient_dob: "07/01/2002",
    patient_name: "safvan",
    patient_place: "malappuram",
    patient_phone: "9567900329",
    patientId: 1,
    hospitalId: 2,
    doctorId: 4,
    booking_date: "08/06/2026",
  });

  const createbooking = http.post(`${BASE_URL}/bookings`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

    const getBookings = http.post(`${BASE_URL}/bookings`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  check(createbooking, {
    "booking success": (r) => r.status === 201,
  });

   check(getBookings, {
    "booking success": (r) => r.status === 200,
  });

  sleep(1);
}
