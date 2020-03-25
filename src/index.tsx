import { Platform } from 'react-native';
import PeekableIOS from './peekable.ios';
import PeekableAndroid from './peekable.android';
import { PeekableViewProps } from './types';

const PeekableView = Platform.select<React.ComponentType<PeekableViewProps>>({
  ios: PeekableIOS,
  android: PeekableAndroid,
});

export default PeekableView;
