import { ReactNode } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";

type AuthLayoutProps = {
  children: ReactNode;
  compact?: boolean;
};

export default function AuthLayout({ children, compact = false }: AuthLayoutProps) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;

  return (
    <View style={[styles.screen, isDesktopWeb && styles.webScreen]}>
      <View style={isDesktopWeb ? styles.webShell : styles.shell}>
        <View
          style={
            isDesktopWeb
              ? styles.webFormPanel
              : [styles.formPanel, compact && styles.compactPanel]
          }
        >
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  webScreen: {
    minHeight: "100vh" as any,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: "#F4F2FA",
  },
  shell: {
    flex: 1,
  },
  webShell: {
    width: "100%",
    maxWidth: 480,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    boxShadow: "0px 18px 44px rgba(65,34,114,0.13)" as any,
  },
  formPanel: {
    flex: 1,
  },
  compactPanel: {
    justifyContent: "center",
  },
  webFormPanel: {
    flexGrow: 0,
    flexShrink: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 30,
  },
});
