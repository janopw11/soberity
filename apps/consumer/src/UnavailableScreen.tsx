import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { title: string; description: string };

export default function UnavailableScreen({ title, description }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <Text style={styles.status}>NOT AVAILABLE YET</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.description}>
          This is a preview of a planned area. No content or services are
          available here yet.
        </Text>
        <Link href="/" dismissTo style={styles.link}>
          Back to welcome
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 24, backgroundColor: '#f7f5ef' },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingVertical: 40,
    gap: 24,
  },
  status: {
    color: '#416455',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: { color: '#183e32', fontSize: 36, fontWeight: '700' },
  description: { color: '#42564c', fontSize: 18, lineHeight: 28 },
  link: {
    color: '#183e32',
    fontSize: 18,
    fontWeight: '700',
    textDecorationLine: 'underline',
    paddingVertical: 16,
  },
});
