import * as React from 'react';
import {
  requireNativeComponent,
  View,
  Platform,
  findNodeHandle,
  ViewStyle,
  StyleProp,
} from 'react-native';

import {
  PreviewAction,
  TraveresedAction,
  MappedAction,
  NativePeekAndPopViewRef,
  ActionEvent,
  PeekableViewProps,
} from './types';

const PlatformMajorVersion =
  typeof Platform.Version === 'string'
    ? parseInt(Platform.Version, 10)
    : Math.floor(Platform.Version);

export const NativePeekAndPopView: React.ComponentType<{
  ref: React.RefObject<NativePeekAndPopViewRef>;
  style: StyleProp<ViewStyle>;
  onPeek?: () => void;
  onPop?: () => void;
  onDisappear?: () => void;
  onPressPreview?: () => void;
  onAction: (event: ActionEvent) => void;
  previewActions: TraveresedAction[];
  children: React.ReactNode;
}> = requireNativeComponent('PeekAndPop');

const traverseActions = (
  actions: PreviewAction[],
  actionsMap: MappedAction[]
) => {
  const traversedAction: TraveresedAction[] = [];

  actions.forEach(currentAction => {
    if (currentAction.type === 'group') {
      const clonedAction = {
        ...currentAction,
        actions: traverseActions(currentAction.actions, actionsMap),
      };

      traversedAction.push(clonedAction);
    } else {
      const { onPress, ...clonedAction } = currentAction;
      // @ts-ignore
      clonedAction._key = actionsMap.length;
      actionsMap.push(onPress);
      traversedAction.push(clonedAction as TraveresedAction);
    }
  });
  return traversedAction;
};

type State = {
  visible: boolean;
  traversedActions: TraveresedAction[];
  mappedActions: MappedAction[];
};

export default class PeekableView extends React.Component<
  PeekableViewProps,
  State
> {
  static getDerivedStateFromProps(props: PeekableViewProps) {
    const mappedActions: MappedAction[] = [];
    const traversedActions = props.previewActions
      ? traverseActions(props.previewActions, mappedActions)
      : undefined;

    return {
      traversedActions,
      mappedActions,
    };
  }

  state: State = {
    visible: false,
    traversedActions: [],
    mappedActions: [],
  };

  preview = React.createRef<NativePeekAndPopViewRef>();
  sourceView = React.createRef<View>();

  componentDidMount() {
    this.preview.current &&
      this.preview.current.setNativeProps({
        childRef: findNodeHandle(this.sourceView.current),
      });
  }

  onDisappear = () => {
    this.setState({
      visible: false,
    });
    this.props.onDisappear && this.props.onDisappear();
  };

  onPeek = () => {
    this.setState({
      visible: true,
    });
    this.props.onPeek && this.props.onPeek();
  };

  onActionsEvent = ({ nativeEvent: { key } }: ActionEvent) => {
    const action = this.state.mappedActions[key];

    action && action();
  };

  render() {
    const {
      renderPreview,
      /* eslint-disable @typescript-eslint/no-unused-vars */
      previewActions,
      onPeek,
      onDisappear,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      onPop,
      onPressPreview,
      children,
      width,
      height,
      ...rest
    } = this.props;

    return (
      <React.Fragment>
        <View {...rest} ref={this.sourceView}>
          {PlatformMajorVersion >= 13 && (
            <NativePeekAndPopView
              // Renders nothing and inside view bound to the screen used by controller
              style={{ width: 0, height: 0 }}
              onDisappear={this.onDisappear}
              onPeek={this.onPeek}
              onPop={onPop}
              onPressPreview={onPressPreview}
              ref={this.preview}
              previewActions={this.state.traversedActions}
              onAction={this.onActionsEvent}
            >
              <View style={{ width, height }}>
                {this.state.visible && renderPreview()}
              </View>
            </NativePeekAndPopView>
          )}
          {children}
        </View>
      </React.Fragment>
    );
  }
}
