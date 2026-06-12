import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import UserAvatar from "../UserAvatar";
import { Usuario } from "../../types/Usuario";

type Props = {
  visible: boolean;
  usuarioActual: Usuario | null;
  texto: string;
  onChangeTexto: (texto: string) => void;
  onClose: () => void;
  onPublish: () => void;
};

export default function CreatePublicationModal({
  visible,
  usuarioActual,
  texto,
  onChangeTexto,
  onClose,
  onPublish,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Nueva publicación</Text>

            <TouchableOpacity onPress={onPublish} disabled={!texto.trim()}>
              <Text
                style={[
                  styles.modalPublishText,
                  !texto.trim() && styles.modalPublishTextDisabled,
                ]}
              >
                Publicar
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tweetBox}>
            <UserAvatar usuario={usuarioActual || ({ nombre: "Yo" } as Usuario)} size={42} />

            <TextInput
              style={styles.tweetInput}
              placeholder="¿Qué querés decir sobre este evento?"
              placeholderTextColor="#9A96A8"
              value={texto}
              onChangeText={onChangeTexto}
              multiline
              autoFocus
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 36,
    minHeight: 360,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  modalCancelText: {
    color: "#6F6D7A",
    fontSize: 14,
    fontWeight: "800",
  },
  modalTitle: {
    color: "#332047",
    fontSize: 16,
    fontWeight: "900",
  },
  modalPublishText: {
    color: "#8B35E8",
    fontSize: 14,
    fontWeight: "900",
  },
  modalPublishTextDisabled: {
    color: "#C8B8E8",
  },
  tweetBox: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tweetInput: {
    flex: 1,
    minHeight: 180,
    marginLeft: 12,
    fontSize: 18,
    color: "#332047",
    lineHeight: 26,
    textAlignVertical: "top",
    outlineStyle: "none" as any,
  },
});