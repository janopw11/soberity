import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type ComponentRef,
} from 'react';
import { Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { spacing } from '@soberity/design-tokens';

export const DialogDropdownViewport = createContext<RefObject<ComponentRef<
  typeof ScrollView
> | null> | null>(null);
export type DropdownOutsideTouch = (x: number, y: number) => void;
export const DialogDropdownTouches = createContext<
  ((handler: DropdownOutsideTouch) => () => void) | null
>(null);

/** Keep a floating field menu within the dialog's scroll viewport, without adding layout height. */
export function useDialogDropdown(open: boolean, onDismiss: () => void) {
  const viewport = useContext(DialogDropdownViewport);
  const registerTouch = useContext(DialogDropdownTouches);
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const menu = useRef<
    ComponentRef<typeof View> | ComponentRef<typeof ScrollView> | null
  >(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  const [placement, setPlacement] = useState({ above: false, height: 192 });
  useEffect(() => {
    if (!open) return;
    if (Platform.OS === 'web') {
      const outside = (event: Event) => {
        const root = anchor.current as unknown as {
          contains: (target: Node | null) => boolean;
        } | null;
        if (root && !root.contains(event.target as Node | null))
          dismiss.current();
      };
      document.addEventListener('pointerdown', outside, true);
      document.addEventListener('focusin', outside, true);
      return () => {
        document.removeEventListener('pointerdown', outside, true);
        document.removeEventListener('focusin', outside, true);
      };
    }
    if (!registerTouch) return;
    let active = true;
    const unregister = registerTouch((x, y) => {
      anchor.current?.measureInWindow((left, top, width, height) => {
        if (
          !active ||
          (x >= left && x <= left + width && y >= top && y <= top + height)
        )
          return;
        const popup = menu.current;
        if (!popup) {
          dismiss.current();
          return;
        }
        popup.measureInWindow((menuLeft, menuTop, menuWidth, menuHeight) => {
          if (
            active &&
            !(
              x >= menuLeft &&
              x <= menuLeft + menuWidth &&
              y >= menuTop &&
              y <= menuTop + menuHeight
            )
          )
            dismiss.current();
        });
      });
    });
    return () => {
      active = false;
      unregister();
    };
  }, [open, registerTouch]);
  useLayoutEffect(() => {
    if (!open || !viewport) return;
    let active = true;
    anchor.current?.measureInWindow((_x, y, _width, height) => {
      viewport.current?.measureInWindow((_vx, top, _vw, viewportHeight) => {
        if (!active) return;
        const above = Math.max(0, y - top - spacing.space4);
        const below = Math.max(
          0,
          top + viewportHeight - y - height - spacing.space4,
        );
        const upwards = below < 128 && above > below;
        setPlacement({
          above: upwards,
          height: Math.max(48, Math.min(192, upwards ? above : below)),
        });
      });
    });
    return () => {
      active = false;
    };
  }, [open, viewport]);
  const menuStyle: ViewStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    maxHeight: placement.height,
    ...(placement.above
      ? { bottom: '100%', marginBottom: spacing.space4 }
      : { top: '100%', marginTop: spacing.space4 }),
  };
  const menuRef = (
    node: ComponentRef<typeof View> | ComponentRef<typeof ScrollView> | null,
  ) => {
    menu.current = node;
  };
  return { anchor, menuRef, menuStyle, menuHeight: placement.height };
}
