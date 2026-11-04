import { check, fail, group } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';

/* global __ENV */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;
const SEEDED_EMAILS = [
  'user1@example.com',
  'user2@example.com',
  'user3@example.com',
  'user4@example.com',
  'user5@example.com',
];
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const options = {
  scenarios: {
    todo_flow: { duration: '30s', executor: 'constant-vus', vus: 10 },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

// Login is throttled to 5 requests per minute per IP, so each seeded user logs in exactly once here
// and VUs share the resulting tokens.
export function setup() {
  return SEEDED_EMAILS.map((email) => {
    const res = http.post(`${API_URL}/auth/login`, JSON.stringify({ email }), { headers: JSON_HEADERS });

    if (res.status !== 200) {
      fail(
        `login failed for ${email} with ${res.status}; the login throttle allows 5 requests per minute, wait and retry`,
      );
    }

    return res.json('data.accessToken');
  });
}

export default function (tokens) {
  const token = tokens[(exec.vu.idInTest - 1) % tokens.length];
  const params = { headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` } };

  group('list', () => {
    const res = http.get(`${API_URL}/todos?offset=0&limit=20`, params);

    check(res, { 'list is 200': (r) => r.status === 200 });
  });

  let todoId;

  group('create', () => {
    const body = JSON.stringify({
      description: 'k6 smoke',
      title: `k6 todo ${exec.vu.idInTest}-${exec.vu.iterationInScenario}`,
    });
    const res = http.post(`${API_URL}/todos`, body, params);

    check(res, { 'create is 201': (r) => r.status === 201 });
    todoId = res.json('data.id');
  });

  group('toggle', () => {
    const res = http.patch(`${API_URL}/todos/${todoId}`, JSON.stringify({ completed: true }), params);

    check(res, { 'toggle is 200': (r) => r.status === 200 });
  });

  group('delete', () => {
    const res = http.del(`${API_URL}/todos/${todoId}`, null, params);

    check(res, { 'delete is 200 or 204': (r) => r.status === 200 || r.status === 204 });
  });
}
