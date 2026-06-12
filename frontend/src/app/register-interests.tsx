import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import InterestChips from "../components/InterestChips";
import Logo from "@/components/Logo";
import { API_URL } from "../config/api";
import { Interes } from "../types/Interes";

export default function RegisterInterestsScreen() {
  const [interesesDisponibles, setInteresesDisponibles] = useState<Interes[]>([]);
  const [intereses, setIntereses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarIntereses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/intereses`);
        const data = await response.json();

        console.log("Status intereses:", response.status);
        console.log("Respuesta intereses:", data);

        if (!response.ok) {
          console.log("Error al obtener intereses:", data.error);
          return;
        }

        setInteresesDisponibles(data.intereses || []);
      } catch (error) {
        console.log("Error al cargar intereses:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarIntereses();
  }, []);

  const toggleInterest = (slug: string) => {
    if (intereses.includes(slug)) {
      setIntereses(intereses.filter((item) => item !== slug));
    } else {
      setIntereses([...intereses, slug]);
    }
  };

  const goToPersonalData = () => {
    router.push({
      pathname: "/register" as any,
      params: {
        intereses: JSON.stringify(intereses),
      },
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
          onPress={goToPersonalData}
          disabled={intereses.length === 0}
        >
          <Text style={styles.primaryButtonText}>Continuar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  container: {
    paddingHorizontal: 34,
    paddingTop: 64,
    paddingBottom: 50,
    alignItems: "center",
  },
  logo: {
    width: 130,
    height: 90,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#332047",
    textAlign: "center",
    marginBottom: 10,
  },
  highlight: {
    color: "#7528F0",
  },
  subtitle: {
    fontSize: 14,
    color: "#8D8A99",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 34,
  },
  interestsContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 34,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D5E2",
    marginRight: 10,
    marginBottom: 12,
  },
  interestChipSelected: {
    backgroundColor: "#7528F0",
    borderColor: "#7528F0",
  },
  interestText: {
    color: "#8D8A99",
    fontSize: 14,
    fontWeight: "700",
  },
  interestTextSelected: {
    color: "#FFFFFF",
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  backText: {
    fontSize: 14,
    color: "#3A2451",
    textDecorationLine: "underline",
  },
});