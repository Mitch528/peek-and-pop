import React from 'react';
import { View } from 'react-native';
import { PeekableViewProps } from './types';

export default class PeekableView extends React.Component<PeekableViewProps> {
  render() {
    const { children, ...rest } = this.props;

    return (
      <React.Fragment>
        <View {...rest}>{children}</View>
      </React.Fragment>
    );
  }
}
