import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { Search, Home, Heart, User, MapPin } from "lucide-react-native";

const featuredEvents = [
  {
    id: 1,
    title: "Lollapalooza 2026",
    interested: "355 interesados",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800",
  },
  {
    id: 2,
    title: "FUTTURA",
    interested: "120 interesados",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800",
  },
];

const recommendedEvents = [
  {
    id: 3,
    title: "Rosedal Fest",
    date: "Sáb 22 mar · Palermo",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800",
  },
  {
    id: 4,
    title: "After Office",
    date: "Vie 28 mar · Recoleta",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
  },
];

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Image
          source={{ uri: "https://i.imgur.com/Oi6Zc3K.png" }}
          style={styles.logo}
        />

        <Text style={styles.title}>¿Qué te pinta hoy?</Text>

        <View style={styles.searchBox}>
          <Search size={18} color="#A7A7B0" />
          <TextInput
            placeholder="Buscar eventos, personas..."
            placeholderTextColor="#A7A7B0"
            style={styles.input}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {["Música", "Salidas", "Networking", "Cultura", "Gastronomía"].map((item, index) => (
            <TouchableOpacity
              key={item}
              style={[styles.category, index === 0 && styles.categoryActive]}
            >
              <Text style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Destacados</Text>
          <Text style={styles.seeAll}>Ver todos</Text>
        </View>

        <View style={styles.featuredGrid}>
          {featuredEvents.map((event) => (
            <TouchableOpacity key={event.id} style={styles.featuredCard}>
              <Image source={{ uri: event.image }} style={styles.featuredImage} />
              <View style={styles.overlay} />
              <View style={styles.cardText}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventInfo}>↗ {event.interested}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recomendados</Text>
          <Text style={styles.seeAll}>Ver todos</Text>
        </View>

        <View style={styles.recommendedList}>
          {recommendedEvents.map((event) => (
            <TouchableOpacity key={event.id} style={styles.recommendedCard}>
              <Image source={{ uri: event.image }} style={styles.recommendedImage} />
              <View>
                <Text style={styles.recommendedTitle}>{event.title}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={13} color="#8B35E8" />
                  <Text style={styles.recommendedDate}>{event.date}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.navbar}>
        <Home size={22} color="#7B2DF0" fill="#7B2DF0" />
        <Search size={22} color="#B8B8C2" />
        <Heart size={22} color="#B8B8C2" />
        <User size={22} color="#B8B8C2" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  container: {
    paddingTop: 70,
    paddingHorizontal: 28,
    paddingBottom: 120,
  },
  logo: {
    width: 76,
    height: 46,
    resizeMode: "contain",
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#332047",
    marginBottom: 22,
  },
  searchBox: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D6E8FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 26,
  },
  input: {
    marginLeft: 10,
    fontSize: 15,
    flex: 1,
    color: "#333",
  },
  categories: {
    marginBottom: 34,
  },
  category: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 14,
  },
  categoryActive: {
    backgroundColor: "#E7F3FF",
  },
  categoryText: {
    color: "#A0A0AA",
    fontSize: 15,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#177EEA",
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#25252C",
  },
  seeAll: {
    fontSize: 14,
    color: "#7B2DF0",
    fontWeight: "600",
  },
  featuredGrid: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 34,
  },
  featuredCard: {
    flex: 1,
    height: 170,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.22)",
},
  cardText: {
    position: "absolute",
    left: 14,
    bottom: 14,
  },
  eventTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  eventInfo: {
    color: "#E9E9F2",
    fontSize: 12,
    marginTop: 3,
  },
  recommendedList: {
    gap: 16,
  },
  recommendedCard: {
    height: 88,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  recommendedImage: {
    width: 116,
    height: 68,
    borderRadius: 15,
    marginRight: 16,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282832",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recommendedDate: {
    fontSize: 13,
    color: "#8B8A99",
    marginLeft: 4,
  },
  navbar: {
    position: "absolute",
    bottom: 28,
    left: 32,
    right: 32,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
  },
});