// Simplified API schema (subset from paste.txt)
// Full schema will be loaded dynamically in production

export const API_SCHEMA = {
  user: {
    description: 'Endpoints related to user',
    endpoints: [
      {
        method: 'GET',
        path: '/rest/user/settings',
        operationId: 'get__rest_user_settings',
        summary: 'GET /rest/user/settings',
        parameters: [],
        has_request_body: false,
      },
      {
        method: 'GET',
        path: '/rest/user/info',
        operationId: 'get__rest_user_info',
        summary: 'GET /rest/user/info',
        parameters: [],
        has_request_body: false,
      },
    ],
  },
  thread: {
    description: 'Endpoints related to thread',
    endpoints: [
      {
        method: 'GET',
        path: '/rest/thread/list_recent',
        operationId: 'get__rest_thread_list_recent',
        summary: 'GET /rest/thread/list_recent',
        parameters: [],
        has_request_body: false,
      },
    ],
  },
  tasks: {
    description: 'Endpoints related to tasks',
    endpoints: [
      {
        method: 'GET',
        path: '/rest/tasks/shortcuts/mentions',
        operationId: 'get__rest_tasks_shortcuts_mentions',
        summary: 'GET /rest/tasks/shortcuts/mentions',
        parameters: [],
        has_request_body: false,
      },
    ],
  },
  other: {
    description: 'Endpoints related to other',
    endpoints: [
      {
        method: 'GET',
        path: '/api/auth/session',
        operationId: 'get__api_auth_session',
        summary: 'GET /api/auth/session',
        parameters: [],
        has_request_body: false,
      },
      {
        method: 'GET',
        path: '/rest/ping',
        operationId: 'get__rest_ping',
        summary: 'GET /rest/ping',
        parameters: [],
        has_request_body: false,
      },
    ],
  },
} as const;
