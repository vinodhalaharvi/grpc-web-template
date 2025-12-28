// API Client - Uses Connect-RPC when available, falls back to mock data
// Replace this with actual Connect client after running: buf generate

import * as Types from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

// Helper for making Connect-style requests
async function connectRequest<T>(service: string, method: string, data: unknown = {}): Promise<T> {
    const response = await fetch(`${API_URL}/${service}/${method}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Connect-Protocol-Version': '1',
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({message: 'Request failed'}));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// Token Service
export const tokenService = {
    createToken: (req: { grantType: Types.GrantType; username: string; password: string }) =>
        connectRequest<Types.TokenResponse>('purecerts.v1.TokenService', 'CreateToken', {
            grant_type: req.grantType,
            username: req.username,
            password: req.password,
        }),

    refreshToken: (req: { refreshToken: string }) =>
        connectRequest<Types.TokenResponse>('purecerts.v1.TokenService', 'RefreshToken', {
            refresh_token: req.refreshToken,
        }),

    revokeToken: (req: { token: string }) =>
        connectRequest<void>('purecerts.v1.TokenService', 'RevokeToken', {token: req.token}),
};

// User Service
export const userService = {
    getCurrentUser: () =>
        connectRequest<Types.User>('purecerts.v1.UserService', 'GetCurrentUser', {}),

    getUser: (userId: string) =>
        connectRequest<Types.User>('purecerts.v1.UserService', 'GetUser', {user_id: userId}),

    listUsers: (req: Types.ListUsersRequest = {}) =>
        connectRequest<Types.ListUsersResponse>('purecerts.v1.UserService', 'ListUsers', req),

    createUser: (req: { email: string; firstName: string; lastName: string; role: Types.Role; password: string }) =>
        connectRequest<Types.User>('purecerts.v1.UserService', 'CreateUser', req),

    updateUser: (req: Partial<Types.User>) =>
        connectRequest<Types.User>('purecerts.v1.UserService', 'UpdateUser', req),

    deleteUser: (userId: string) =>
        connectRequest<void>('purecerts.v1.UserService', 'DeleteUser', {user_id: userId}),

    inviteUser: (req: { email: string; role: Types.Role }) =>
        connectRequest<{ inviteId: string }>('purecerts.v1.UserService', 'InviteUser', req),
};

// Certificate Service
export const certificateService = {
    listCertificates: (req: Types.ListCertificatesRequest = {}) =>
        connectRequest<Types.ListCertificatesResponse>('purecerts.v1.CertificateService', 'ListCertificates', req),

    getCertificate: (certId: string) =>
        connectRequest<Types.Certificate>('purecerts.v1.CertificateService', 'GetCertificate', {cert_id: certId}),

    issueCertificate: (req: {
        caId: string;
        commonName: string;
        san?: string[];
        validityDays?: number;
        keyAlgorithm?: Types.KeyAlgorithm;
        keySize?: number;
    }) =>
        connectRequest<Types.Certificate>('purecerts.v1.CertificateService', 'IssueCertificate', req),

    renewCertificate: (certId: string) =>
        connectRequest<Types.Certificate>('purecerts.v1.CertificateService', 'RenewCertificate', {cert_id: certId}),

    revokeCertificate: (certId: string, reason?: string) =>
        connectRequest<void>('purecerts.v1.CertificateService', 'RevokeCertificate', {cert_id: certId, reason}),

    deleteCertificate: (certId: string) =>
        connectRequest<void>('purecerts.v1.CertificateService', 'DeleteCertificate', {cert_id: certId}),

    downloadCertificate: (certId: string, format: string) =>
        connectRequest<{ data: string; filename: string }>('purecerts.v1.CertificateService', 'DownloadCertificate', {
            cert_id: certId,
            format,
        }),
};

// CA Service
export const caService = {
    listCAs: (req: Types.ListCAsRequest = {}) =>
        connectRequest<Types.ListCAsResponse>('purecerts.v1.CAService', 'ListCAs', req),

    getCA: (caId: string) =>
        connectRequest<Types.CA>('purecerts.v1.CAService', 'GetCA', {ca_id: caId}),

    createCA: (req: {
        name: string;
        type: Types.CAType;
        subject: Types.Subject;
        keyAlgorithm: Types.KeyAlgorithm;
        keySize: number;
        validityYears: number;
    }) =>
        connectRequest<Types.CA>('purecerts.v1.CAService', 'CreateCA', req),

    updateCA: (req: Partial<Types.CA>) =>
        connectRequest<Types.CA>('purecerts.v1.CAService', 'UpdateCA', req),

    deleteCA: (caId: string) =>
        connectRequest<void>('purecerts.v1.CAService', 'DeleteCA', {ca_id: caId}),
};

// Tenant Service
export const tenantService = {
    getTenant: (tenantId?: string) =>
        connectRequest<Types.Tenant>('purecerts.v1.TenantService', 'GetTenant', {tenant_id: tenantId}),

    updateTenant: (req: Partial<Types.Tenant>) =>
        connectRequest<Types.Tenant>('purecerts.v1.TenantService', 'UpdateTenant', req),
};

// Session Service
export const sessionService = {
    listSessions: () =>
        connectRequest<Types.ListSessionsResponse>('purecerts.v1.SessionService', 'ListSessions', {}),

    revokeSession: (sessionId: string) =>
        connectRequest<void>('purecerts.v1.SessionService', 'RevokeSession', {session_id: sessionId}),

    revokeAllOtherSessions: () =>
        connectRequest<void>('purecerts.v1.SessionService', 'RevokeAllOtherSessions', {}),
};

// API Key Service
export const apiKeyService = {
    listAPIKeys: () =>
        connectRequest<Types.ListAPIKeysResponse>('purecerts.v1.APIKeyService', 'ListAPIKeys', {}),

    createAPIKey: (req: { name: string; scopes: string[]; expiresAt?: string }) =>
        connectRequest<Types.APIKey & { secret: string }>('purecerts.v1.APIKeyService', 'CreateAPIKey', req),

    revokeAPIKey: (keyId: string) =>
        connectRequest<void>('purecerts.v1.APIKeyService', 'RevokeAPIKey', {key_id: keyId}),
};

// Billing Service
export const billingService = {
    getSubscription: () =>
        connectRequest<Types.Subscription>('purecerts.v1.BillingService', 'GetSubscription', {}),

    getUsage: () =>
        connectRequest<Types.Usage>('purecerts.v1.BillingService', 'GetUsage', {}),

    listPlans: () =>
        connectRequest<{ plans: Types.Plan[] }>('purecerts.v1.BillingService', 'ListPlans', {}),

    listInvoices: () =>
        connectRequest<{ invoices: Types.Invoice[] }>('purecerts.v1.BillingService', 'ListInvoices', {}),
};

// Audit Service
export const auditService = {
    listAuditLogs: (req: Types.ListAuditLogsRequest = {}) =>
        connectRequest<Types.ListAuditLogsResponse>('purecerts.v1.AuditService', 'ListAuditLogs', req),

    getAuditLog: (logId: string) =>
        connectRequest<Types.AuditLog>('purecerts.v1.AuditService', 'GetAuditLog', {log_id: logId}),
};

// Health Service
export const healthService = {
    check: () =>
        connectRequest<{ status: string; version: string }>('purecerts.v1.HealthService', 'Check', {}),
};