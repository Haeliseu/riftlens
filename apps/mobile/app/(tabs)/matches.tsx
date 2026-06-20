import { StyleSheet, Text, View } from "react-native"

export default function MatchesTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Historique de parties</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#888", fontSize: 14 },
})
