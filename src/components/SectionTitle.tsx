import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export type SectionTitleSize = 'page' | 'section' | 'block';

interface SectionTitleProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  tone?: 'light' | 'dark';
  size?: SectionTitleSize;
  style?: ViewStyle;
}

const TITLE_STYLES: Record<SectionTitleSize, TextStyle> = {
  page: { ...Typography.h1, fontSize: 24, lineHeight: 30 },
  section: { ...Typography.h3, fontSize: 18 },
  block: { ...Typography.bodyBold },
};

const ICON_SIZES: Record<SectionTitleSize, number> = {
  page: 20,
  section: 18,
  block: 16,
};

export const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  title,
  subtitle,
  tone = 'light',
  size = 'section',
  style,
}) => {
  const isDark = tone === 'dark';

  return (
    <View style={[styles.row, style]}>
      <Ionicons
        name={icon}
        size={ICON_SIZES[size]}
        color={isDark ? Colors.primary : Colors.ink}
        style={styles.icon}
      />
      <View style={styles.body}>
        <Text style={[TITLE_STYLES[size], isDark ? styles.titleDark : styles.titleLight]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  body: {
    flex: 1,
  },
  titleLight: {
    color: Colors.ink,
  },
  titleDark: {
    color: Colors.paper,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  subtitleLight: {
    color: Colors.ash,
  },
  subtitleDark: {
    color: Colors.textLightMuted,
  },
});
