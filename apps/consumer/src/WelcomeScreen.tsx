import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>SCIENCE. CONNECTION. ALCOHOL-FREE.</Text>
        <Text accessibilityRole="header" style={styles.title}>
          More to life.{'\n'}Together.
        </Text>
        <Text style={styles.intro}>
          A place for curious minds and alcohol-free experiences. Discover what
          Soberity is building.
        </Text>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>An early preview</Text>
          <Text style={styles.body}>
            Learning, events and accounts are not available yet. You can explore
            the planned areas below.
          </Text>
        </View>
        <View style={styles.cards}>
          <Link href="/science" asChild>
            <Pressable style={styles.card}>
              <Text style={styles.number}>01 / LEARN</Text>
              <Text accessibilityRole="header" style={styles.cardTitle}>
                Science
              </Text>
              <Text style={styles.body}>
                Planned: research, clear explanations and sources you can check.
              </Text>
              <Text style={styles.cardLink}>Explore Science →</Text>
            </Pressable>
          </Link>
          <Link href="/events" asChild>
            <Pressable style={styles.card}>
              <Text style={styles.number}>02 / CONNECT</Text>
              <Text accessibilityRole="header" style={styles.cardTitle}>
                Events & Community
              </Text>
              <Text style={styles.body}>
                Planned: sober parties, sober raves and other alcohol-free
                activities.
              </Text>
              <Text style={styles.cardLink}>Explore Events →</Text>
            </Pressable>
          </Link>
        </View>
        <Link href="/account" style={styles.account}>
          Your account — coming later →
        </Link>
        <Text style={styles.footer}>
          Science first. Evidence always. No judgment.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 24, backgroundColor: '#f7f5ef' },
  content: {
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
    paddingVertical: 24,
    gap: 24,
  },
  eyebrow: {
    color: '#416455',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: { color: '#183e32', fontSize: 48, fontWeight: '700', lineHeight: 54 },
  intro: { color: '#42564c', fontSize: 19, lineHeight: 29, maxWidth: 640 },
  notice: { backgroundColor: '#e8eee3', borderRadius: 16, padding: 20, gap: 8 },
  noticeTitle: { color: '#183e32', fontSize: 16, fontWeight: '700' },
  body: { color: '#42564c', fontSize: 16, lineHeight: 25 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  card: {
    flexGrow: 1,
    flexBasis: 300,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d5dfd3',
    padding: 24,
    gap: 16,
  },
  number: {
    color: '#416455',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardTitle: { color: '#183e32', fontSize: 26, fontWeight: '700' },
  cardLink: {
    color: '#183e32',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 8,
  },
  account: {
    color: '#183e32',
    fontSize: 16,
    paddingVertical: 12,
    textDecorationLine: 'underline',
  },
  footer: { color: '#52645a', fontSize: 13, lineHeight: 20 },
});
