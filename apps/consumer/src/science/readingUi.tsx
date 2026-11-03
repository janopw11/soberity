import { useState, type PropsWithChildren } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { documentText, mediaUri, researchUrl, type DocumentNode } from './scienceApi';

export function ReadingText({ children, heading = false, muted = false }: PropsWithChildren<{ heading?: boolean; muted?: boolean }>) {
  const { colors } = useThemePreferences();
  return <Text selectable accessibilityRole={heading ? 'header' : undefined} style={[heading ? typography.h3 : typography.body, { color: heading ? colors.primary : muted ? colors.textSecondary : colors.textPrimary }]}>{children}</Text>;
}
export function ReadingCard({ children }: PropsWithChildren) {
  const { colors } = useThemePreferences();
  return <View style={{ gap: spacing.space12, padding: spacing.space16, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.lg }}>{children}</View>;
}
export function ResearchLink({ url, title }: { url: string; title: string }) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(false);
  const safe = researchUrl(url);
  if (!safe) return <ReadingText muted>{title} · {t('discover.invalidLink')}</ReadingText>;
  return <View><Pressable accessibilityRole="link" accessibilityLabel={title} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={() => { setFailed(false); void Linking.openURL(safe).catch(() => setFailed(true)); }} style={{ minHeight: 48, justifyContent: 'center', paddingVertical: spacing.space8, borderWidth: 2, borderRadius: radii.sm, borderColor: focused ? colors.focusRing : 'transparent' }}><Text style={{ ...typography.body, color: colors.primary, textDecorationLine: 'underline' }}>{title} ↗</Text></Pressable>{failed ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{t('discover.linkError')} {safe}</Text> : null}</View>;
}
export function ReadingImage({ uri, alt, cover = false }: { uri: string; alt: string; cover?: boolean }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [ratio, setRatio] = useState(16 / 9);
  const [failed, setFailed] = useState(false);
  if (failed) return <ReadingText muted>{t('discover.imageUnavailable')} · {alt}</ReadingText>;
  return <Image source={{ uri }} accessibilityLabel={alt} accessible resizeMode={cover ? 'cover' : 'contain'} style={{ width: '100%', aspectRatio: cover ? 16 / 9 : ratio, borderRadius: radii.md, backgroundColor: colors.surfaceAlt }} onError={() => setFailed(true)} onLoad={event => { const { width, height } = event.nativeEvent.source; if (width > 0 && height > 0) setRatio(width / height); }} />;
}
const inlineTypes = new Set(['text', 'hardBreak']);
export function RichDocument({ node, depth = 0 }: { node: DocumentNode; depth?: number }) {
  const { colors } = useThemePreferences();
  if (depth > 20) return null;
  const children = node.content ?? [];
  const alignment = node.attrs?.textAlign;
  const textAlign = alignment === 'center' || alignment === 'right' || alignment === 'justify' ? alignment : 'left';
  const inline = (item: DocumentNode, key: number) => {
    if (item.type === 'hardBreak') return <Text key={key}>{'\n'}</Text>;
    const marks = item.marks ?? [];
    const style: TextStyle = {
      fontWeight: marks.some(mark => mark.type === 'bold') ? '700' : undefined,
      fontStyle: marks.some(mark => mark.type === 'italic') ? 'italic' : undefined,
      textDecorationLine: marks.some(mark => mark.type === 'strike') ? 'line-through' : marks.some(mark => mark.type === 'underline') ? 'underline' : undefined,
      backgroundColor: marks.some(mark => mark.type === 'code') ? colors.surfaceAlt : undefined,
    };
    const url = researchUrl(marks.find(mark => mark.type === 'link')?.attrs?.href);
    return <Text key={key} style={[style, url ? { color: colors.primary, textDecorationLine: 'underline' } : undefined]}>{item.text}</Text>;
  };
  if (node.type === 'image') {
    const src = node.attrs?.src;
    const match = typeof src === 'string' ? /^\/api\/v1\/science\/media\/([0-9a-f-]{36})$/i.exec(src) : null;
    return match ? <ReadingImage uri={mediaUri(match[1]!)} alt={String(node.attrs?.alt ?? '')} /> : null;
  }
  if (node.type === 'horizontalRule') return <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }} />;
  if (node.type === 'paragraph' || node.type === 'heading') {
    const links = children.flatMap(child => (child.marks ?? []).filter(mark => mark.type === 'link').map(mark => ({ url: researchUrl(mark.attrs?.href), title: child.text ?? '' }))).filter(link => link.url);
    return <View style={{ gap: spacing.space4 }}><Text selectable accessibilityRole={node.type === 'heading' ? 'header' : undefined} style={[node.type === 'heading' ? (node.attrs?.level === 1 ? typography.h2 : node.attrs?.level === 3 ? typography.bodyStrong : typography.h3) : typography.body, { color: node.type === 'heading' ? colors.primary : colors.textPrimary, textAlign }]}>{children.filter(child => inlineTypes.has(child.type)).map(inline)}</Text>{links.map((link, index) => <ResearchLink key={index} url={link.url!} title={link.title || link.url!} />)}</View>;
  }
  if (node.type === 'bulletList' || node.type === 'orderedList') return <View style={{ gap: spacing.space8 }}>{children.map((child, index) => <View key={index} style={{ flexDirection: 'row', gap: spacing.space8 }}><Text style={{ ...typography.body, color: colors.primary }}>{node.type === 'orderedList' ? `${Number(node.attrs?.start ?? 1) + index}.` : '•'}</Text><View style={{ flex: 1 }}><RichDocument node={child} depth={depth + 1} /></View></View>)}</View>;
  if (node.type === 'text') return <ReadingText>{documentText(node)}</ReadingText>;
  return <View style={{ gap: spacing.space16, ...(node.type === 'blockquote' ? { borderLeftWidth: 3, borderColor: colors.primary, paddingLeft: spacing.space16 } : {}) }}>{children.map((child, index) => <RichDocument key={index} node={child} depth={depth + 1} />)}</View>;
}
