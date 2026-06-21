const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('hml_token');
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  register: (body) => req('POST', '/auth/register', body),
  forgotPassword: (email) => req('POST', '/auth/forgot-password', { email }),
  resetPassword: (email, newPassword) => req('POST', '/auth/reset-password', { email, newPassword }),

  // Users
  getUsers: () => req('GET', '/users'),
  getMe: () => req('GET', '/users/me'),
  updateMe: (body) => req('PUT', '/users/me', body),
  createUser: (body) => req('POST', '/users', body),
  updateUser: (id, body) => req('PUT', `/users/${id}`, body),
  deleteUser: (id) => req('DELETE', `/users/${id}`),

  // Courses
  getCourses: () => req('GET', '/courses'),
  getCourse: (id) => req('GET', `/courses/${id}`),
  createCourse: (body) => req('POST', '/courses', body),
  updateCourse: (id, body) => req('PUT', `/courses/${id}`, body),
  deleteCourse: (id) => req('DELETE', `/courses/${id}`),

  // Enrollments
  getEnrollments: () => req('GET', '/enrollments'),
  enroll: (courseId) => req('POST', '/enrollments', { courseId }),
  updateEnrollment: (id, body) => req('PUT', `/enrollments/${id}`, body),
  adminEnroll: (userId, courseId) => req('POST', '/enrollments/admin', { userId, courseId }),
  getCourseEnrollments: (courseId) => req('GET', `/enrollments/course/${courseId}`),
  unenroll: (enrollmentId) => req('DELETE', `/enrollments/${enrollmentId}`),
  markMaterialDone: (enrollmentId, materialId) => req('POST', `/enrollments/${enrollmentId}/material/${materialId}`),
  submitQuiz: (enrollmentId, body) => req('POST', `/enrollments/${enrollmentId}/quiz`, body),

  // Certificates
  getCertificates: () => req('GET', '/certificates'),
  getCertTemplates: () => req('GET', '/certificates/templates'),
  createCertTemplate: (body) => req('POST', '/certificates/templates', body),
  updateCertTemplate: (id, body) => req('PUT', `/certificates/templates/${id}`, body),
  issueCertificate: (body) => req('POST', '/certificates/issue', body),
  deleteCertificate: (id) => req('DELETE', `/certificates/${id}`),
  getExternalCerts: () => req('GET', '/certificates/external'),
  getAllExternalCerts: () => req('GET', '/certificates/external/all'),
  addExternalCert: (body) => req('POST', '/certificates/external', body),
  deleteExternalCert: (id) => req('DELETE', `/certificates/external/${id}`),

  // Training
  getTraining: () => req('GET', '/training'),
  createTraining: (body) => req('POST', '/training', body),
  updateTraining: (id, body) => req('PUT', `/training/${id}`, body),
  deleteTraining: (id) => req('DELETE', `/training/${id}`),

  // Announcements
  getAnnouncements: () => req('GET', '/announcements'),
  createAnnouncement: (body) => req('POST', '/announcements', body),
  updateAnnouncement: (id, body) => req('PUT', `/announcements/${id}`, body),
  deleteAnnouncement: (id) => req('DELETE', `/announcements/${id}`),

  // Reports
  getReportSummary: () => req('GET', '/reports/summary'),
  getComplianceReport: () => req('GET', '/reports/compliance'),
};
