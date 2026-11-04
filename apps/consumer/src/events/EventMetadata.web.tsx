import Head from 'expo-router/head';

/** Static Expo shell: do not claim indexable server-rendered dynamic event pages. */
export function EventMetadata({ title, description }: { title: string; description: string }) {
  return <Head><title>{title} · Soberity</title><meta name="description" content={description.slice(0, 160)} /><meta name="robots" content="noindex,follow" /></Head>;
}
