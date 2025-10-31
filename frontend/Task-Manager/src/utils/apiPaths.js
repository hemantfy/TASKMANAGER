export const BASE_URL = "https://taskmanager-on78.onrender.com/";

// utils/apiPaths.js
export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register", // Register a new user (Admin or Member)
    LOGIN: "/api/auth/login",       // Authenticate user & return JWT token
    GET_PROFILE: "/api/auth/profile", // Get logged-in user details
  },

  USERS: {
    GET_ALL_USERS: "/api/users",                 // Get all users (Admin only)
    GET_USER_BY_ID: (userId) => `/api/users/${userId}`, // Get user by ID
    CREATE_USER: "/api/users", // Create a new user (Admin only)
    UPDATE_USER: (userId) => `/api/users/${userId}`, // Update user details
    DELETE_USER: (userId) => `/api/users/${userId}`, // Delete a user
    RESET_USER_PASSWORD: (userId) => `/api/users/${userId}/password`,
  },

  PROFILE: {
    UPDATE_PHOTO: "/api/users/profile/photo",
    DELETE_PHOTO: "/api/users/profile/photo",    
    CHANGE_PASSWORD: "/api/users/profile/password",   // Delete a user
    UPDATE_PROFILE: "/api/auth/profile",
  },

  TASKS: {
    GET_DASHBOARD_DATA: "/api/tasks/dashboard-data", // Get Dashboard Data
    GET_NOTIFICATIONS: "/api/tasks/notifications", // Get dashboard notifications
    GET_USER_DASHBOARD_DATA: "/api/tasks/user-dashboard-data", // Get User Dashboard Data
    GET_ALL_TASKS: "/api/tasks", // Get all tasks (Admin: all, User: only assigned tasks)
    GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`, // Get task by ID
    CREATE_TASK: "/api/tasks", // Create a new task (Admin only)
    UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`, // Update task details
    DELETE_TASK: (taskId) => `/api/tasks/${taskId}`, // Delete a task (Admin only)

    UPDATE_TASK_STATUS: (taskId) => `/api/tasks/${taskId}/status`, // Update task status
    UPDATE_TODO_CHECKLIST: (taskId) => `/api/tasks/${taskId}/todo`, // Update todo checklist
  },
  REPORTS: {
    EXPORT_TASKS: "/api/reports/export/tasks", // Download all tasks as an Excel/PDF report
    EXPORT_USERS: "/api/reports/export/users", // Download user-task report
  },
  
  NOTICES: {
    PUBLISH: "/api/notices",
    GET_ACTIVE: "/api/notices/active",
    GET_ALL: "/api/notices",
    DELETE: (noticeId) => `/api/notices/${noticeId}`,
  },

  MATTERS: {
    GET_ALL: "/api/matters",
    GET_BY_ID: (matterId) => `/api/matters/${matterId}`,
    CREATE: "/api/matters",
    UPDATE: (matterId) => `/api/matters/${matterId}`,
    DELETE: (matterId) => `/api/matters/${matterId}`,
  },

  CASES: {
    GET_ALL: "/api/cases",
    GET_BY_ID: (caseId) => `/api/cases/${caseId}`,
    CREATE: "/api/cases",
    UPDATE: (caseId) => `/api/cases/${caseId}`,
    DELETE: (caseId) => `/api/cases/${caseId}`,
  },

  DOCUMENTS: {
    GET_ALL: "/api/documents",
    GET_BY_ID: (documentId) => `/api/documents/${documentId}`,
    CREATE: "/api/documents",
    UPDATE: (documentId) => `/api/documents/${documentId}`,
    DELETE: (documentId) => `/api/documents/${documentId}`,
  },
  
  IMAGE: {
    UPLOAD_IMAGE: "api/auth/upload-image",
  },
};