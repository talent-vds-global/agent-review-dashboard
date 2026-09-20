import { findUserByUsername, type UserProfile } from '../data/dummy';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

const STORAGE_KEYS = {
  TOKEN: 'qc_portal_auth_token',
  USER: 'qc_portal_user_profile',
};

class AuthService {
  /**
   * Đăng nhập người dùng vào hệ thống.
   *
   * GHI CHÚ KHI GHÉP API THẬT:
   * Chỉ cần thay đổi khối lệnh bên dưới bằng lệnh gọi API backend thật, ví dụ:
   * ```ts
   * const response = await fetch('/api/v1/auth/login', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify(credentials),
   * });
   * if (!response.ok) throw new Error('Đăng nhập thất bại');
   * const data: AuthResponse = await response.json();
   * this.saveSession(data.token, data.user);
   * return data;
   * ```
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Giả lập network delay 350ms
    await new Promise((resolve) => setTimeout(resolve, 350));

    const { username, password } = credentials;

    if (!username.trim()) {
      throw new Error('Vui lòng nhập tên đăng nhập hoặc email.');
    }
    if (!password) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    const account = findUserByUsername(username);

    if (!account) {
      throw new Error('Tài khoản không tồn tại trên hệ thống.');
    }

    if (account.passwordPlainText !== password) {
      throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    }

    // Tách mật khẩu ra khỏi thông tin trả về
    const { passwordPlainText: _, ...userProfile } = account;

    const mockToken = `jwt-mock-${account.id}-${Date.now()}`;
    this.saveSession(mockToken, userProfile);

    return {
      user: userProfile,
      token: mockToken,
    };
  }

  /**
   * Đăng xuất và dọn dẹp phiên làm việc
   */
  async logout(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.warn('Không thể xóa session khỏi localStorage', error);
    }
  }

  /**
   * Lấy thông tin user hiện tại từ session
   */
  getCurrentUser(): UserProfile | null {
    try {
      const userJson = localStorage.getItem(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  /**
   * Lấy token xác thực hiện tại
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
      return null;
    }
  }

  /**
   * Kiểm tra người dùng đã đăng nhập hay chưa
   */
  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getCurrentUser());
  }

  private saveSession(token: string, user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.warn('Không thể lưu session vào localStorage', error);
    }
  }
}

export const authService = new AuthService();
