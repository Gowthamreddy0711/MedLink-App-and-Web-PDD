import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // ramp up to 100 users
    { duration: '40s', target: 100 }, // stay at 100 users
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    http_req_failed: ['rate<0.01'],   // error rate should be less than 1%
  },
};

export default function () {
  // Simulate App Launch / Main Dashboard Load
  // Replace with actual API endpoints when deploying to production
  const res = http.get('https://google.com'); // Placeholder for backend health check

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
