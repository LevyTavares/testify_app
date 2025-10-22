import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = { path?: string };

export default function EditScreenInfo({ path }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.path}>Arquivo: {path}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  path: { color: "#666", fontSize: 12 },
});
