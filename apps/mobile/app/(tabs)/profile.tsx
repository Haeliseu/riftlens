import { StyleSheet, Text, View } from "react-native"

export default function ProfileTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profil</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#888", fontSize: 14 },
})
