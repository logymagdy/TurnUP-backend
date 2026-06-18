import React, { createContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { lightColors, darkColors } from "../theme/theme";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [userTheme, setUserTheme] = useState(null);


  const theme = userTheme ?? systemTheme;
  const isDark = theme === "dark";

  const colors = isDark ? darkColors : lightColors;

  // load saved
  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem("theme");
      if (saved !== null) setUserTheme(saved); 
    };
    load();
  }, []);

  // save
  useEffect(() => {
    const save = async () => {
      if (userTheme === null) {
        await AsyncStorage.removeItem("theme"); 
      } else {
        await AsyncStorage.setItem("theme", userTheme);
      }
    };
    save();
  }, [userTheme]);

  const toggleTheme = () => {
    setUserTheme((prev) => {
      if (prev === null) return "dark";  
      if (prev === "dark") return "light";
      if (prev === "light") return null; 
    });
  };

  return (
    <ThemeContext.Provider
      value={{ theme, isDark, colors, toggleTheme, userTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};