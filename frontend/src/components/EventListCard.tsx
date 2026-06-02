import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { CalendarDays, MapPin, Heart } from "lucide-react-native";

import { Evento } from "../types/Evento";
import {
  obtenerImagen,
  formatearFecha,
  obtenerUbicacion,
} from "../utils/eventHelpers";

type EventListCardProps = {
  evento: Evento;
  onPress: () => void;
  showHeart?: boolean;
  isFavorite?: boolean;
  onHeartPress?: () => void;
  status?: string;
};

export default function EventListCard({
  evento,
  onPress,
  showHeart = false,
  isFavorite = false,
  onHeartPress,
  status,
}: EventListCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Image
        source={{ uri: obtenerImagen(evento.imagen) }}
        style={styles.eventImage}
      />

      <View style={styles.eventInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {evento.nombre}
          </Text>

          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>
              {evento.categoria || "evento"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <CalendarDays size={13} color="#7528F0" />
          <Text style={styles.infoText}>{formatearFecha(evento.fecha)}</Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={13} color="#7528F0" />
          <Text style={styles.infoText} numberOfLines={1}>
            {obtenerUbicacion(evento.ubicacion)}
          </Text>
        </View>

        {status && (
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
      </View>

      {showHeart && (
        <TouchableOpacity
          style={styles.heartButton}
          activeOpacity={0.85}
          onPress={(e) => {
            e.stopPropagation();
            onHeartPress?.();
          }}
        >
          <Heart
            size={22}
            color={isFavorite ? "#EF4444" : "#9B98A8"}
            fill={isFavorite ? "#EF4444" : "transparent"}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  eventImage: {
    width: 104,
    height: 82,
    borderRadius: 16,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#2D2934",
    marginRight: 6,
  },
  categoryTag: {
    backgroundColor: "#F1ECFF",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryText: {
    color: "#7528F0",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#8D8A99",
    flex: 1,
  },
  heartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8F7FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  statusPill: {
    marginTop: 5,
    backgroundColor: "#ECFDF3",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#12A150",
    fontSize: 11,
    fontWeight: "900",
  },
});