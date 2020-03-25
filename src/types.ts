import { ViewProps } from 'react-native';

export type PeekableViewProps = ViewProps & {
  renderPreview: () => React.ReactNode;
  previewActions?: PreviewAction[];
  onPeek?: () => void;
  onPop?: () => void;
  onDisappear?: () => void;
  onPressPreview?: () => void;
  children: React.ReactNode;
  width: number;
  height: number;
};

export type PreviewAction =
  | {
      type?: 'normal';
      selected?: boolean;
      label: string;
      onPress: () => void;
    }
  | {
      type: 'destructive';
      label: string;
      onPress: () => void;
    }
  | {
      type: 'group';
      label: string;
      actions: PreviewAction[];
    };

export type MappedAction = (() => void) | undefined;

export type TraveresedAction =
  | {
      type: 'normal';
      selected?: boolean;
      label: string;
      onPress: () => void;
    }
  | {
      type: 'destructive';
      label: string;
      _key: number;
    }
  | {
      type: 'group';
      label: string;
      actions: TraveresedAction[];
    };

export type NativePeekAndPopViewRef = {
  setNativeProps(props: { childRef: null | number }): void;
};

export type ActionEvent = { nativeEvent: { key: number } };
