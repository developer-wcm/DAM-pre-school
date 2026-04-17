import { StyleSheet, Text, View } from 'react-native';

export default function ParentFeesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Fees Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  text: { fontSize: 18, fontWeight: '600', color: '#1A1A2E' },
});
