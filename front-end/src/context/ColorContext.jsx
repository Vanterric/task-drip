import { createContext, useEffect, useState } from "react";

export const ColorContext = createContext();

export const ColorProvider = ({ children }) => {
  
const colors = {
  text: {
    primary: '#4F5962',       // body text
    secondary: '#91989E',     // subtext / labels
    info: '#91989E',          // tooltip / helper text
    darkPrimary: '#ffffff',   // body text in dark mode
    darkSecondary: '#A1A8B0', // subtext / labels in dark mode
    darkInfo: '#4F5962',      // tooltip / helper text in dark mode
  },
  background: {
    light: '#FAECE5',
    dark: '#212732',
    card: '#FFFFFF',
    darkCard: '#4F5962',
  },
  accent: {
    primary: '#4C6CA8',
    primaryHover: '#3A5D91',
    success: '#4BAF8E',
    successHover: '#3B8F75',
    destructive: '#D66565',
    destructiveHover: '#B94E4E',
  },
}
  

  return (
    <ColorContext.Provider value={{colors}}>
      {children}
    </ColorContext.Provider>
  );
};
