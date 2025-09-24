import axios, { type AxiosRequestConfig } from "axios";

// ✅ 공통 axios 호출 함수
async function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  const instance = axios.create({
    baseURL: import.meta.env.API_BASE_URL || "http://localhost:8080/api",
    timeout: 10000,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 요청 인터셉터
  instance.interceptors.request.use(
    (cfg) => {
      // 예: 토큰 주입
      const token = localStorage.getItem("accessToken");
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    },
    (error) => Promise.reject(error)
  );

  // 응답 인터셉터
  instance.interceptors.response.use(
    (res) => res.data,
    async (error) => {
      // 예: 토큰 만료 처리
      if (error.response?.status === 401) {
        console.warn("Unauthorized - redirect to login or refresh token");
      }
      return Promise.reject(error);
    }
  );

  return instance(config);
}

//
// ✅ 공개 함수들: 인스턴스는 export하지 않고 함수만 export
//
export function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig) {
  return request<T>({ method: "GET", url, params, ...config });
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return request<T>({ method: "POST", url, data, ...config });
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return request<T>({ method: "PUT", url, data, ...config });
}

export function patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return request<T>({ method: "PATCH", url, data, ...config });
}

export function del<T = any>(url: string, config?: AxiosRequestConfig) {
  return request<T>({ method: "DELETE", url, ...config });
}
