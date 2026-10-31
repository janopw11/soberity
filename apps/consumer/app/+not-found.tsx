import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundRoute() {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        gap: 24,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        accessibilityRole="header"
        style={{ fontSize: 28, color: '#183e32' }}
      >
        Page not found
      </Text>
      <Link
        href="/"
        replace
        style={{
          padding: 16,
          color: '#183e32',
          textDecorationLine: 'underline',
        }}
      >
        Back to welcome
      </Link>
    </View>
  );
}
