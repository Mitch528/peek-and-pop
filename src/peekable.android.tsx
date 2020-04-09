import React from 'react';
import { PeekableViewProps } from './types';

export default class PeekableView extends React.Component<PeekableViewProps> {
  render() {
    const { children } = this.props;

    return <React.Fragment>{children}</React.Fragment>;
  }
}
