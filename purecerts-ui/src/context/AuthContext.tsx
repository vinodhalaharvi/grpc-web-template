import {createContext, ReactNode, useCallback, useContext, useEffect, useState} from 'react';
import {tokenService, userService} from '../api/client';
import {GrantType, User} from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setUser(null);
            return;
        }

        try {
            const currentUser = await userService.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
        } catch {
            // Token might be expired
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    // Verify token is still valid
                    await refreshUser();
                } catch {
                    // Invalid stored user
                    localStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const response = await tokenService.createToken({
            grantType: GrantType.PASSWORD,
            username: email,
            password: password,
        });

        // if (response.mfaRequired) {
        //   // Handle MFA flow
        //   throw new Error('MFA required');
        // }
        //

        if (response.accessToken) {
            localStorage.setItem('access_token', response.accessToken);
            if (response.refreshToken) {
                localStorage.setItem('refresh_token', response.refreshToken);
            }
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);
            }
        }
    };

    const logout = useCallback(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            tokenService.revokeToken({token}).catch(() => {
                // Ignore errors on logout
            });
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
