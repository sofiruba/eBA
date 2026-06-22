// src/utils/googleAuth.ts
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { API_URL } from "../config/api";

export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID_CONFIGURED =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID_CONFIGURED =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_CLIENT_ID;
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
