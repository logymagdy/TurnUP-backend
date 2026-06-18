import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: "http://192.168.0.89:3000/api",
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
API.interceptors.request.use(
  async (config) => {
    let token = await SecureStore.getItemAsync("userToken");
    if (!token) token = await AsyncStorage.getItem("userToken");
    if (token) {
      const cleanToken = token.replace(/^"|"$/g, "").trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const responseData = error?.response?.data;
    const status = error?.response?.status;

    // ✅ شيك على كل الاحتمالات الممكنة للـ token expired
    const isTokenExpired =
      responseData?.code === "TOKEN_EXPIRED" ||
      responseData?.code === "UNAUTHORIZED" ||
      status === 401 ||
      (responseData?.message &&
        (responseData.message.toLowerCase().includes("token expired") ||
         responseData.message.toLowerCase().includes("expired") ||
         responseData.message.toLowerCase().includes("invalid token")));

    if (isTokenExpired && !originalRequest._retry && originalRequest.url !== "/auth/refresh-token") {
      originalRequest._retry = true;

      try {
        let refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) refreshToken = await AsyncStorage.getItem("refreshToken");
        console.log("🔄 Attempting token refresh...");

        if (!refreshToken) {
          console.log("❌ No refresh token found");
          throw new Error("No refresh token");
        }

        // ✅ استخدم axios مباشرة عشان نتجنب الـ interceptor loop
        const res = await axios.post(
          "http://192.168.0.89:3000/api/auth/refresh-token",
          { refreshToken }
        );

        const newToken = res.data?.token || res.data?.accessToken;
        console.log("📦 Refresh response:", JSON.stringify(res.data, null, 2));

        if (!newToken) throw new Error("No new token in refresh response");

        // ✅ احفظ الـ token الجديد في الاتنين
        await SecureStore.setItemAsync("userToken", newToken);
        await AsyncStorage.setItem("userToken", newToken);

        // ✅ لو فيه refresh token جديد احفظه
        if (res.data?.refreshToken) {
          await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);
        }

        console.log("✅ Token refreshed successfully!");

        // ✅ أعد الـ request الأصلي بالـ token الجديد
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);

      } catch (refreshError) {
        console.log("❌ Token refresh failed:", refreshError?.response?.data || refreshError.message);

        // ✅ امسح كل التوكنات عشان المستخدم يسجل دخول من جديد
        await SecureStore.deleteItemAsync("userToken");
        await SecureStore.deleteItemAsync("refreshToken");
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("refreshToken");

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ─── SALON DETAILS ────────────────────────────────────────────────────────────
export const getStoreView = (storeId) =>
  API.get(`/store/view/${storeId}`);

export const getStorePublic = (storeId) =>
  API.get(`/store/public/${storeId}`);

export const favoriteStore = (storeId) =>
  API.post(`/store/${storeId}/favorite`);

export const getStoreStylists = (storeId) =>
  API.get(`/store/${storeId}/stylists`);

export const getActivePromotions = (storeId) =>
  API.get(`/promotion/${storeId}/active`);

// ─── BOOKING — DATE & SPECIALISTS ────────────────────────────────────────────
export const getAvailableSlots = (storeId, date) =>
  API.get(`/store/${storeId}/slots`, { params: { date } });

export const getAvailableSpecialists = (storeId, date, time) =>
  API.get(`/store/${storeId}/specialists`, { params: { date, time } });

// ─── BOOKING — CREATE ─────────────────────────────────────────────────────────
export const createBooking = (body) =>
  API.post("/booking/create", body);

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
export const payAtStore = (appointmentId) =>
  API.post("/payment/pay-at-store", { appointmentId });

export const initiatePayment = (appointmentId) =>
  API.post("/payment/initiate", { appointmentId });

// ─── MY BOOKINGS ──────────────────────────────────────────────────────────────
export const getMyBookings = () =>
  API.get("/booking/my-bookings");

// ─── BOOKING HISTORY ──────────────────────────────────────────────────────────
export const getBookingHistory = (filter = null) =>
  API.get("/booking/history", { params: filter ? { filter } : {} });

// ─── BOOKING DETAIL ───────────────────────────────────────────────────────────
export const getBookingDetails = (bookingId) =>
  API.get(`/booking/${bookingId}/details`);

export const getBookingReceipt = (bookingId) =>
  API.get(`/booking/${bookingId}/receipt`);

export const getRebookInfo = (bookingId) =>
  API.get(`/booking/${bookingId}/rebook`);

// ─── CANCEL BOOKING ───────────────────────────────────────────────────────────
export const cancelBooking = (bookingId, reason) =>
  API.put(`/booking/${bookingId}/cancel`, { reason });

// ─── RATE BOOKING ─────────────────────────────────────────────────────────────
export const rateBooking = (bookingId, rating, review) =>
  API.post(`/booking/${bookingId}/rate`, { rating, review });

// ─── DASHBOARD & STORE CONTROLS ───────────────────────────────────────────────
export const getBusinessDashboard = () =>
  API.get("/analytics/business-dashboard");

export const toggleWorkDay = (isActive) =>
  API.patch("/store/toggle-workday", { isActive });

export const pauseStore = () =>
  API.patch("/store/pause");

export const resumeStore = () =>
  API.patch("/store/resume");

export default API;