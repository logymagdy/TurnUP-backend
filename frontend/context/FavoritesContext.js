import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../services/api.js";
import { AuthContext } from "../App";

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const { userToken } = useContext(AuthContext) || {};

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await API.get("/users/favorites");
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.log("Favorites fetch error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (itemOrId) => {
    const storeId = typeof itemOrId === "string" 
      ? itemOrId 
      : (itemOrId?._id || itemOrId?.id || itemOrId?.salonId?._id || itemOrId?.salonId?.id);
    
    if (!storeId) return false;

    try {
      const res = await API.post(`/users/favorites/${storeId}`);
      await fetchFavorites();
      return res.data.isFavorited;
    } catch (err) {
      console.log("Toggle favorite error:", err?.response?.data || err.message);
      return false;
    }
  };

  const isFavorite = (itemOrId) => {
    const storeId = typeof itemOrId === "string"
      ? itemOrId
      : (itemOrId?._id || itemOrId?.id || itemOrId?.salonId?._id || itemOrId?.salonId?.id);
    
    return favorites.some((f) => String(f._id || f.id) === String(storeId));
  };

  useEffect(() => {
    if (userToken) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [userToken]);

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorite, fetchFavorites, loading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};