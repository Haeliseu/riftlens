import { useLocalSearchParams } from "expo-router"
import { ScrollView, StyleSheet, Text } from "react-native"

export default function SummonerPage() {
  const { region, name, tag } = useLocalSearchParams<{
    region: string
    name: string
    tag: string
  }>()

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {decodeURIComponent(name ?? "")}#{tag}
      </Text>
      <Text style={styles.region}>{region}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  region: { color: "#888", fontSize: 13 },
})
