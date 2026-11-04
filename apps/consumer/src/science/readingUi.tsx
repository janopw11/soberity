import { Link, type Href } from 'expo-router';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
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
/** Real web anchor (including modifier-click/new tab) and shared native navigation. */
export function PublicationCard({ href, title, children }: PropsWithChildren<{ href: Href; title: string }>) {
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <View style={{
      width: '100%',
      overflow: 'hidden',
      borderRadius: radii.xl,
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: focused ? colors.focusRing : colors.primary,
      backgroundColor: pressed || hovered ? colors.surfaceAlt : colors.surface,
      ...(focused && Platform.OS === 'web' ? { outlineColor: colors.focusRing, outlineWidth: 2, outlineStyle: 'solid' as const, outlineOffset: 2 } : {}),
    }}>
      <Link href={href} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={title}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setPressed(false); }}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={{ width: '100%', minHeight: 48, flexDirection: 'column', alignItems: 'stretch' }}
        >
          {children}
        </Pressable>
      </Link>
    </View>
  );
}

export function ResearchLink({ url, title, subtle = false }: { url: string; title: string; subtle?: boolean }) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(false);
  const safe = researchUrl(url);
  if (!safe) return <ReadingText muted>{title} · {t('discover.invalidLink')}</ReadingText>;
  return <View><Pressable accessibilityRole="link" accessibilityLabel={title} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={() => { setFailed(false); void Linking.openURL(safe).catch(() => setFailed(true)); }} style={{ minHeight: 48, justifyContent: 'center', paddingVertical: spacing.space8, borderWidth: 2, borderRadius: radii.sm, borderColor: focused ? colors.focusRing : 'transparent' }}><Text style={{ ...(subtle ? typography.small : typography.body), color: subtle ? colors.textSecondary : colors.primary, textDecorationLine: 'underline' }}>{title} ↗</Text></Pressable>{failed ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{t('discover.linkError')} {safe}</Text> : null}</View>;
}
/** Quiet references footer; keep research links available without a callout card. */
export function ArticleSources({ sources }: { sources: { title: string; url: string }[] }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  if (!sources.length) return null;
  return (
    <View style={{ gap: spacing.space8 }}>
      {Platform.OS === 'web' ? (
        <hr style={{ width: '100%', margin: 0, border: 0, borderTop: `1px solid ${colors.border}` }} />
      ) : (
        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }} />
      )}
      <Text accessibilityRole="header" style={{ ...typography.label, color: colors.textSecondary, paddingTop: spacing.space8 }}>
        {t('discover.sources')}
      </Text>
      <View>
        {sources.map((source, index) => (
          <ResearchLink key={`${source.url}-${index}`} url={source.url} title={source.title} subtle />
        ))}
      </View>
    </View>
  );
}

export function ReadingImage({ uri, alt, cover = false, thumbnail = false }: { uri: string; alt: string; cover?: boolean; thumbnail?: boolean }) {
  // A different image starts with fresh loading/error/dimension state.
  return <SizedReadingImage key={uri} uri={uri} alt={alt} cover={cover} thumbnail={thumbnail} />;
}

function SizedReadingImage({ uri, alt, cover, thumbnail }: { uri: string; alt: string; cover: boolean; thumbnail: boolean }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [ratio, setRatio] = useState(16 / 9);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cover) return;
    let active = true;
    // getSize has the same callback contract on native and RN Web. Avoid
    // reading dimensions from platform-specific onLoad event payloads.
    Image.getSize(uri, (width, height) => {
      if (active && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        setRatio(width / height);
      }
    }, () => {
      // Keep the fallback ratio; the displayed image handles its own errors.
    });
    return () => { active = false; };
  }, [uri, cover]);

  if (failed) return <ReadingText muted>{t('discover.imageUnavailable')} · {alt}</ReadingText>;
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={alt}
      accessible
      resizeMode={cover ? 'cover' : 'contain'}
      style={thumbnail
        ? { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: colors.surfaceAlt }
        : { width: '100%', aspectRatio: cover ? 16 / 9 : ratio, borderRadius: radii.md, backgroundColor: colors.surfaceAlt }}
      onError={() => setFailed(true)}
    />
  );
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
