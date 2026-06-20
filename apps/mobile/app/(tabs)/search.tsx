import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

export default function SearchTab() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  function handleSearch() {
    const trimmed = query.trim()
    if (!trimmed) return
    const parts = trimmed.includes("#") ? trimmed.split("#") : trimmed.split(" ")
    if (parts.length >= 2) {
      const gameName = parts[0] ?? ""
      const tagLine = parts.slice(1).join("").toUpperCase()
      router.push(`/summoner/EUW1/${encodeURIComponent(gameName)}/${tagLine}`)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rechercher un joueur</Text>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Joueur#EUW"
        placeholderTextColor="#666"
        onSubmitEditing={handleSearch}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Rechercher</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  label: { color: "#fff", fontSize: 16, fontWeight: "600" },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 15,
  },
  button: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
})
