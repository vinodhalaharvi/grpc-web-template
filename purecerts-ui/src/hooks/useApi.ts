import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  certificateService,
  caService,
  userService,
  tenantService,
  sessionService,
  apiKeyService,
  billingService,
  auditService,
} from '../api/client';
import * as Types from '../types';

// Query Keys
export const queryKeys = {
  certificates: ['certificates'] as const,
  certificate: (id: string) => ['certificate', id] as const,
  cas: ['cas'] as const,
  ca: (id: string) => ['ca', id] as const,
  users: ['users'] as const,
  user: (id: string) => ['user', id] as const,
  currentUser: ['currentUser'] as const,
  tenant: ['tenant'] as const,
  sessions: ['sessions'] as const,
  apiKeys: ['apiKeys'] as const,
  subscription: ['subscription'] as const,
  usage: ['usage'] as const,
  plans: ['plans'] as const,
  invoices: ['invoices'] as const,
  auditLogs: ['auditLogs'] as const,
};

// Certificate Hooks
export function useCertificates(params?: Types.ListCertificatesRequest) {
  return useQuery({
    queryKey: [...queryKeys.certificates, params],
    queryFn: () => certificateService.listCertificates(params),
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: queryKeys.certificate(id),
    queryFn: () => certificateService.getCertificate(id),
    enabled: !!id,
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: certificateService.issueCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
  });
}

export function useRenewCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: certificateService.renewCertificate,
    onSuccess: (_, certId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates });
      queryClient.invalidateQueries({ queryKey: queryKeys.certificate(certId) });
    },
  });
}

export function useRevokeCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ certId, reason }: { certId: string; reason?: string }) =>
      certificateService.revokeCertificate(certId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates });
    },
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: certificateService.deleteCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
  });
}

// CA Hooks
export function useCAs(params?: Types.ListCAsRequest) {
  return useQuery({
    queryKey: [...queryKeys.cas, params],
    queryFn: () => caService.listCAs(params),
  });
}

export function useCA(id: string) {
  return useQuery({
    queryKey: queryKeys.ca(id),
    queryFn: () => caService.getCA(id),
    enabled: !!id,
  });
}

export function useCreateCA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: caService.createCA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cas });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
  });
}

export function useDeleteCA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: caService.deleteCA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cas });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
  });
}

// User Hooks
export function useUsers(params?: Types.ListUsersRequest) {
  return useQuery({
    queryKey: [...queryKeys.users, params],
    queryFn: () => userService.listUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => userService.getUser(id),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => userService.getCurrentUser(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(data.userId) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
  });
}

export function useInviteUser() {
  return useMutation({
    mutationFn: userService.inviteUser,
  });
}

// Tenant Hooks
export function useTenant() {
  return useQuery({
    queryKey: queryKeys.tenant,
    queryFn: () => tenantService.getTenant(),
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantService.updateTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant });
    },
  });
}

// Session Hooks
export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => sessionService.listSessions(),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionService.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionService.revokeAllOtherSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

// API Key Hooks
export function useAPIKeys() {
  return useQuery({
    queryKey: queryKeys.apiKeys,
    queryFn: () => apiKeyService.listAPIKeys(),
  });
}

export function useCreateAPIKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiKeyService.createAPIKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
  });
}

export function useRevokeAPIKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiKeyService.revokeAPIKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys });
      queryClient.invalidateQueries({ queryKey: queryKeys.usage });
    },
  });
}

// Billing Hooks
export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.subscription,
    queryFn: () => billingService.getSubscription(),
  });
}

export function useUsage() {
  return useQuery({
    queryKey: queryKeys.usage,
    queryFn: () => billingService.getUsage(),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => billingService.listPlans(),
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices,
    queryFn: () => billingService.listInvoices(),
  });
}

// Audit Hooks
export function useAuditLogs(params?: Types.ListAuditLogsRequest) {
  return useQuery({
    queryKey: [...queryKeys.auditLogs, params],
    queryFn: () => auditService.listAuditLogs(params),
  });
}
