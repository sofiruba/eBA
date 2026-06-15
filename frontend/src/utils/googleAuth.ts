// src/utils/googleAuth.ts
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
export const GOOGLE_REDIRECT_URI = "https://auth.expo.io/@nattyy/eba";

WebBrowser.maybeCompleteAuthSession();

export const loginConGoogle = async () => {
  const result = await WebBrowser.openAuthSessionAsync(
    `${API_URL}/api/usuarios/auth/google`,
    "eba://auth"
  );
  
  console.log("Resultado Google:", JSON.stringify(result));
  return result;
};
