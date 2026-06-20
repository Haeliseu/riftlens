import { View, Text, StyleSheet } from "react-native"
import { CURRENT_SEASON_LABEL } from "@riftlens/riot-api"

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RiftLens</Text>
      <Text style={styles.subtitle}>{CURRENT_SEASON_LABEL}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  subtitle: { color: "#888", fontSize: 14, marginTop: 4 },
})
