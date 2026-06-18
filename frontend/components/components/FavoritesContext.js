import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage"; 

export const FavoritesContext = createContext();
const BASE_URL = "http://192.168.0.89:3000/api";

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. جلب البيانات
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      console.log("🔍 [CONTEXT] جاري محاولة قراءة الكاش المحلي...");
      const localFavs = await AsyncStorage.getItem("cached_favorites");
      
      if (localFavs) {
        console.log("📦 [CONTEXT] تم العثور على كاش محلي:", JSON.parse(localFavs).length, "صالونات.");
        setFavorites(JSON.parse(localFavs));
      }

      const userToken = await SecureStore.getItemAsync("userToken");
      if (!userToken) {
        console.log("⚠️ [CONTEXT] لم يتم العثور على userToken في الـ SecureStore!");
        return;
      }

      console.log("🚀 [CONTEXT] جاري طلب الـ Wishlist من السيرفر...");
      const response = await axios.get(`${BASE_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      
      console.log("📥 [CONTEXT] رد السيرفر على الـ GET:", response.data);

      const serverFavs = response.data?.data?.wishlist || response.data?.wishlist || response.data?.data || response.data;
      
      if (Array.isArray(serverFavs)) {
        setFavorites(serverFavs);
        await AsyncStorage.setItem("cached_favorites", JSON.stringify(serverFavs));
      }
    } catch (error) {
      console.log("❌ [CONTEXT ERROR] فشل جلب المفضلة من السيرفر:", error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. الـ Toggle (هنا مربط الفرس)
  const toggleFavorite = async (salon) => {
    console.log("🎯 [CONTEXT] تم الضغط على صالون:", salon?.name || salon?.storeName);
    
    const salonId = salon._id || salon.id || salon.salonId?._id || salon.salonId?.id;
    if (!salonId) {
      console.log("❌ [CONTEXT] فشل تحديد الـ ID للصالون! الكائن المرسل هو:", salon);
      return;
    }

    console.log("🆔 [CONTEXT] الـ ID المستخرج هو:", salonId);

    // تحديث سريع للـ UI والكاش
    let updatedFavs = [...favorites];
    const isExist = updatedFavs.some(fav => (fav._id || fav.id || fav.salonId?._id || fav.salonId?.id) === salonId);

    if (isExist) {
      updatedFavs = updatedFavs.filter(fav => (fav._id || fav.id || fav.salonId?._id || fav.salonId?.id) !== salonId);
    } else {
      updatedFavs.push(salon);
    }

    setFavorites(updatedFavs);
    await AsyncStorage.setItem("cached_favorites", JSON.stringify(updatedFavs));

    try {
      const userToken = await SecureStore.getItemAsync("userToken");
      if (!userToken) {
        console.log("⚠️ [CONTEXT] الـ Token طار وقت الـ Toggle!");
        return;
      }

      console.log("📡 [CONTEXT] جاري إرسال الـ POST للباكيند...");
      const response = await axios.post(
        `${BASE_URL}/wishlist/toggle`,
        { salonId: salonId, id: salonId, businessId: salonId }, 
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      console.log("🎉 [CONTEXT SUCCESS] السيرفر سجل بنجاح! الرد:", response.data);
    } catch (error) {
      console.log("🔴 [SERVER REJECT] السيرفر رفض المزامنة! السبب الحقيقي تحت السطر ده:");
      console.log(JSON.stringify(error?.response?.data || error.message, null, 2));
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, fetchFavorites, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
};