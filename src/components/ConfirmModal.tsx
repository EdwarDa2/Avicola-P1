import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';
import { Button } from './Button';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={styles.dialog}
          onPress={(e) => e.stopPropagation()}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${message}`}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: destructive ? Colors.dangerLight : Colors.warningLight },
            ]}
          >
            <Ionicons
              name={destructive ? 'trash-outline' : 'alert-circle-outline'}
              size={32}
              color={destructive ? Colors.danger : Colors.warning}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <Button
              title={cancelText}
              onPress={onCancel}
              variant="secondary"
              style={styles.halfButton}
            />
            <Button
              title={confirmText}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
              style={styles.halfButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 8, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.ash,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  halfButton: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
});

