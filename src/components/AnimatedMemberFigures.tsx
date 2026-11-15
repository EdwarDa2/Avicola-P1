import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';
import { AgeGroupKey } from '@/types';
import { useApp } from '@/application/state/AppContext';

interface AnimatedMemberFiguresProps {
  ageCounts: Record<AgeGroupKey, number>;
  variant?: 'detailed' | 'compact';
}

interface MemberFigure {
  id: string;
  ageKey: AgeGroupKey;
  label: string;
  shortLabel: string;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const AGE_CONFIG: Record<
  AgeGroupKey,
  {
    label: string;
    shortLabel: string;
    iconName: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
  }
> = {
  '19+': {
    label: 'Adulto',
    shortLabel: 'Adulto',
    iconName: 'person',
    color: Colors.ink,
    bgColor: '#e4f222', // Highlighter Yellow
  },
  '14-18': {
    label: 'Adolescente',
    shortLabel: '14-18',
    iconName: 'walk',
    color: '#0284c7', // Sky Blue
    bgColor: '#e0f2fe',
  },
  '9-13': {
    label: 'Niño',
    shortLabel: '9-13',
    iconName: 'happy',
    color: '#16a34a', // Emerald Green
    bgColor: '#dcfce7',
  },
  '4-8': {
    label: 'Infante',
    shortLabel: '4-8',
    iconName: 'happy-outline',
    color: '#ea580c', // Orange
    bgColor: '#ffedd5',
  },
  '0-3': {
    label: 'Bebé / 0-3',
    shortLabel: '0-3',
    iconName: 'heart',
    color: '#9333ea', // Purple
    bgColor: '#f3e8ff',
  },
};

export const AnimatedMemberFigures: React.FC<AnimatedMemberFiguresProps> = ({
  ageCounts,
  variant = 'detailed',
}) => {
  const { reduceMotion } = useApp();

  // Genera la lista individual de personas de la familia en orden de mayor a menor
  const members: MemberFigure[] = [];
  const groupOrder: AgeGroupKey[] = ['19+', '14-18', '9-13', '4-8', '0-3'];

  for (const key of groupOrder) {
    const count = ageCounts[key] || 0;
    const config = AGE_CONFIG[key];
    for (let i = 1; i <= count; i++) {
      members.push({
        id: `${key}-${i}`,
        ageKey: key,
        label: `${config.label} ${i}`,
        shortLabel: config.shortLabel,
        iconName: config.iconName,
        color: config.color,
        bgColor: config.bgColor,
      });
    }
  }

  const isCompact = variant === 'compact';
  const total = members.length;

  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={28} color={Colors.disabled} />
        <Text style={styles.emptyText}>
          Sin integrantes registrados aún. Usa los controles +/− para agregar personas.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      {!isCompact && (
        <View style={styles.stageHeader}>
          <Text style={styles.stageTitle}>FIGURAS DE LA FAMILIA ({total})</Text>
          <Text style={styles.stageSubtitle}>
            Representación visual sincronizada con los contadores (CP-23)
          </Text>
        </View>
      )}

      <Animated.View layout={reduceMotion ? undefined : Layout.springify()} style={styles.figuresRow}>
        {members.map((member) => (
          <Animated.View
            key={member.id}
            entering={reduceMotion ? undefined : ZoomIn.duration(320).springify()}
            exiting={reduceMotion ? undefined : ZoomOut.duration(200)}
            layout={reduceMotion ? undefined : Layout.springify()}
            style={[
              isCompact ? styles.figureCompact : styles.figureDetailed,
              { backgroundColor: member.bgColor, borderColor: member.color },
            ]}
            accessible={true}
            accessibilityLabel={member.label}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={member.iconName}
                size={isCompact ? 16 : 22}
                color={member.color}
              />
            </View>

            {!isCompact && (
              <Text
                style={[styles.memberLabel, { color: member.color }]}
                numberOfLines={1}
              >
                {member.shortLabel}
              </Text>
            )}
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  containerCompact: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginBottom: 0,
  },
  stageHeader: {
    marginBottom: Spacing.sm,
  },
  stageTitle: {
    ...Typography.captionBold,
    color: Colors.ash,
    letterSpacing: 0.6,
    fontSize: 11,
  },
  stageSubtitle: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 11,
    marginTop: 1,
  },
  figuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  figureDetailed: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 54,
    ...Shadows.sm,
  },
  figureCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberLabel: {
    ...Typography.captionBold,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderStyle: 'dashed',
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.ash,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 260,
  },
});

