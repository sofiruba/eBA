import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import InterestChips from "../components/InterestChips";
import Logo from "@/components/Logo";
import { API_URL } from "../config/api";
import { Interes } from "../types/Interes";

export default function RegisterInterestsGoogleScreen() {
  const { usuarioId } = useLocalSearchParams();
  const [interesesDisponibles, setInteresesDisponibles] = useState<Interes[]>([]);
  const [intereses, setIntereses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarIntereses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/intereses`);
        const data = await response.json();
        if (response.ok) setInteresesDisponibles(data.intereses || []);
      } catch (error) {
        console.log("Error al cargar intereses:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarIntereses();
  }, []);

  const toggleInterest = (slug: string) => {
    setIntereses(prev => 
      prev.includes(slug) ? prev.filter(i => i !== slug) : [...prev, slug]
    );
  };

  const continuar = () => {
    if (intereses.length === 0) {
      alert("Seleccioná al menos un interés.");
      return;
    }
    router.push({
      pathname: "/complete-profile-google" as any,
      params: { usuarioId, intereses: JSON.stringify(intereses) },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Logo size="large" centered={true} showText={true} />

        <Text style={styles.title}>
          Elegí tus <Text style={styles.highlight}>intereses</Text>
        </Text>

        <Text style={styles.subtitle}>
          Esto nos ayuda a mostrarte eventos y personas más afines a vos.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#7528F0" />
        ) : (
          <View style={styles.interestsContainer}>
            <InterestChips
              intereses={interesesDisponibles}
              seleccionados={intereses}
              onPress={toggleInterest}
              variant="register"
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            intereses.length === 0 && styles.disabledButton,
          ]}
          onPress={continuar}
          disabled={intereses.length === 0}
        >
          <Text style={styles.primaryButtonText}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F5FF" },
  container: { paddingHorizontal: 34, paddingTop: 64, paddingBottom: 50, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#332047", textAlign: "center", marginBottom: 10 },
  highlight: { color: "#7528F0" },
  subtitle: { fontSize: 14, color: "#8D8A99", textAlign: "center", lineHeight: 21, marginBottom: 34 },
  interestsContainer: { width: "100%", flexDirection: "row", flexWrap: "wrap", marginBottom: 34 },
  primaryButton: { width: "100%", height: 54, borderRadius: 12, backgroundColor: "#7528F0", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
  // copiá el return de register-interests.tsx y cambiá goToPersonalData por continuar
