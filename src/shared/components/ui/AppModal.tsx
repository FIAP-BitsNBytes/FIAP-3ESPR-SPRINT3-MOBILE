import { ReactNode } from 'react';
import {
  GestureResponderEvent,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { appStyles } from '@/shared/theme/appStyles';
import { colors } from '@/shared/theme';

type AppModalVariant = 'center' | 'sheet';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  variant?: AppModalVariant;
  avoidKeyboard?: boolean;
  children: ReactNode;
  testID?: string;
}

interface KeyboardWrapperProps {
  enabled: boolean;
  children: ReactNode;
}

/**
 * Opt-in keyboard avoidance, matching the LoginScreen KeyboardAvoidingView
 * pattern (`padding` on iOS; native resize handles Android).
 */
function KeyboardWrapper({ enabled, children }: KeyboardWrapperProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const stopPropagation = (event: GestureResponderEvent) => {
  event.stopPropagation();
};

/**
 * Shared modal wrapper for the app.
 *
 * - Always wires `onRequestClose` so the Android hardware back button closes
 *   the modal (previously broken in screens using bare `<Modal>`).
 * - `center`: transparent fade with dark backdrop; tapping the backdrop
 *   closes, tapping the card does not.
 * - `sheet`: slide-up sheet; `pageSheet` on iOS, full-screen slide fallback
 *   on Android/web (`pageSheet` is iOS-only and incompatible with
 *   `transparent`).
 */
export function AppModal({
  visible,
  onClose,
  variant = 'center',
  avoidKeyboard = false,
  children,
  testID,
}: AppModalProps) {
  if (variant === 'sheet') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={onClose}
        testID={testID}
      >
        <KeyboardWrapper enabled={avoidKeyboard}>
          <View style={styles.sheetContainer} testID={testID ? `${testID}-sheet` : undefined}>
            {children}
          </View>
        </KeyboardWrapper>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <KeyboardWrapper enabled={avoidKeyboard}>
        <Pressable
          style={appStyles.modalOverlay}
          onPress={onClose}
          accessibilityLabel="Fechar modal"
          testID={testID ? `${testID}-backdrop` : undefined}
        >
          <Pressable
            style={appStyles.modalCard}
            onPress={stopPropagation}
            testID={testID ? `${testID}-card` : undefined}
          >
            {children}
          </Pressable>
        </Pressable>
      </KeyboardWrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
