import { Stack } from "expo-router";
import { View } from "react-native";

import InAppNotificationToast from "../components/InAppNotificationToast";

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <InAppNotificationToast />
    </View>
  );
}
