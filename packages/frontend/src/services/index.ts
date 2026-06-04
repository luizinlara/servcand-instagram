import api from './api';

export const authService = {
  login: (data: { email: string; password: string }) => api.post<any>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<any>('/auth/me'),
  refresh: (refreshToken: string) => api.post<any>('/auth/refresh', { refreshToken }),
};

export const companiesService = {
  findAll: (params?: any) => api.get<any[]>('/companies', { params }),
  findOne: (id: string) => api.get<any>(`/companies/${id}`),
  create: (data: any) => api.post<any>('/companies', data),
  update: (id: string, data: any) => api.put<any>(`/companies/${id}`, data),
  remove: (id: string) => api.delete(`/companies/${id}`),
  activate: (id: string) => api.patch(`/companies/${id}/activate`),
  deactivate: (id: string) => api.patch(`/companies/${id}/deactivate`),
};

export const personsService = {
  findAll: (params?: any) => api.get<any[]>('/persons', { params }),
  findOne: (id: string) => api.get<any>(`/persons/${id}`),
  getStats: () => api.get<any>('/persons/stats'),
  register: (data: any) => api.post<any>('/persons/register', data),
  create: (data: any) => api.post<any>('/persons', data),
  update: (id: string, data: any) => api.put<any>(`/persons/${id}`, data),
  approve: (id: string, data: any) => api.patch<any>(`/persons/${id}/approve`, data),
  remove: (id: string) => api.delete(`/persons/${id}`),
};

export const usersService = {
  findAll: () => api.get<any[]>('/users'),
  findOne: (id: string) => api.get<any>(`/users/${id}`),
  create: (data: any) => api.post<any>('/users', data),
  update: (id: string, data: any) => api.put<any>(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
};

export const profilesService = {
  findAll: () => api.get<any[]>('/profiles'),
  findOne: (id: string) => api.get<any>(`/profiles/${id}`),
  findPermissions: () => api.get<any[]>('/profiles/permissions'),
  create: (data: any) => api.post<any>('/profiles', data),
  update: (id: string, data: any) => api.put<any>(`/profiles/${id}`, data),
  remove: (id: string) => api.delete(`/profiles/${id}`),
};

export const regionsService = {
  findAll: () => api.get<any[]>('/regions'),
  findOne: (id: string) => api.get<any>(`/regions/${id}`),
  create: (data: any) => api.post<any>('/regions', data),
  update: (id: string, data: any) => api.put<any>(`/regions/${id}`, data),
  remove: (id: string) => api.delete(`/regions/${id}`),
};

export const leadershipService = {
  findAll: () => api.get<any[]>('/leadership'),
  findByRegion: (regionId: string) => api.get<any[]>(`/leadership/region/${regionId}`),
  findOne: (id: string) => api.get<any>(`/leadership/${id}`),
  create: (data: any) => api.post<any>('/leadership', data),
  update: (id: string, data: any) => api.put<any>(`/leadership/${id}`, data),
  deactivate: (id: string) => api.patch(`/leadership/${id}/deactivate`),
  remove: (id: string) => api.delete(`/leadership/${id}`),
};

export const missionsService = {
  findAll: () => api.get<any[]>('/missions'),
  findOne: (id: string) => api.get<any>(`/missions/${id}`),
  getWeeklyMissions: (personId: string, weekNumber?: number, year?: number) =>
    api.get<any>(`/missions/person/${personId}/weekly`, { params: { weekNumber, year } }),
  getPersonMissions: (personId: string, params?: any) =>
    api.get<any[]>(`/missions/person/${personId}`, { params }),
  create: (data: any) => api.post<any>('/missions', data),
  update: (id: string, data: any) => api.put<any>(`/missions/${id}`, data),
  validate: (data: any) => api.post<any>('/missions/validate', data),
  remove: (id: string) => api.delete(`/missions/${id}`),
};

export const instagramService = {
  getPostsByPerson: (personId: string) => api.get<any[]>(`/instagram/posts/${personId}`),
  createManualPost: (data: any) => api.post<any>('/instagram/posts/manual', data),
  getConfig: () => api.get<any>('/instagram/config'),
  updateConfig: (data: any) => api.put<any>('/instagram/config', data),
  validatePost: (personId: string, postId: string) =>
    api.post(`/instagram/validate/${personId}/${postId}`),
};

export const salaryService = {
  getPersonSalary: (personId: string) => api.get<any>(`/salary/person/${personId}`),
  generateWeeklyPayment: (data: any) => api.post<any>('/salary/generate-weekly', data),
  generateWeeklyPaymentsForCompany: (data: { weekNumber: number; year: number }) =>
    api.post<any>('/salary/generate-weekly/company', data),
  getReport: (params?: any) => api.get<any>('/salary/report', { params }),
  markAsPaid: (paymentId: string) => api.patch(`/salary/payments/${paymentId}/paid`),
};

export const parametersService = {
  get: () => api.get<any>('/parameters'),
  update: (data: any) => api.put<any>('/parameters', data),
};
