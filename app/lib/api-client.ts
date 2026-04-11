/**
 * Light client-side API fetcher with automatic Bearer token support
 * and silent refresh retry logic. 
 */

class ApiClient {
    private accessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    setToken(token: string | null) {
        this.accessToken = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    getToken() {
        return this.accessToken;
    }

    private async refresh() {
        try {
            const resp = await fetch('/api/auth/refresh', { method: 'POST' });
            if (!resp.ok) throw new Error('refresh failed');
            const data = await resp.json();
            this.setToken(data.accessToken);
            return data.accessToken;
        } catch (err) {
            this.setToken(null);
            return null;
        }
    }

    async fetch(url: string, options: RequestInit = {}) {
        const headers = new Headers(options.headers || {});
        if (this.accessToken) {
            headers.set('Authorization', `Bearer ${this.accessToken}`);
        }

        let response = await fetch(url, { ...options, headers });

        // Handle 401: attempt automatic refresh once
        if (response.status === 401) {
            const newToken = await this.refresh();
            if (newToken) {
                headers.set('Authorization', `Bearer ${newToken}`);
                response = await fetch(url, { ...options, headers });
            }
        }

        return response;
    }
}

export const api = new ApiClient();
