import React from 'react';
import {
  requireNativeComponent,
  View,
  findNodeHandle,
  Dimensions,
} from 'react-native';

export const NativePeekAndPopleView = requireNativeComponent(
  'PeekAndPop',
  null
);

export default class PeekableView extends React.Component {
  static traverseActions(actions, actionsMap) {
    const traversedAction = [];
    if (!actions) {
      return;
    }
    actions.forEach(currentAction => {
      if (currentAction.group) {
        const { group, ...clonedAction } = currentAction;
        clonedAction.group = this.traverseActions(group, actionsMap);
        traversedAction.push(clonedAction);
      } else {
        const { action, ...clonedAction } = currentAction;
        clonedAction._key = actionsMap.length;
        actionsMap.push(action);
        traversedAction.push(clonedAction);
      }
    });
    return traversedAction;
  }

  static getDerivedStateFromProps(props) {
    const mappedActions = [];
    const traversedActions = PeekableView.traverseActions(
      props.previewActions,
      mappedActions
    );
    return {
      traversedActions,
      mappedActions,
    };
  }

  preview = React.createRef();
  sourceView = React.createRef();
  componentDidMount() {
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

  state = {
    visible: false,

    traversedActions: [],
    mappedActions: [],
  };

  onActionsEvent = ({ nativeEvent: { key } }) => {
    this.state.mappedActions[key]();
  };

  render() {
    const { width, height } = Dimensions.get('window');
    return (
      <React.Fragment>
        <View {...this.props} ref={this.sourceView}>
          <NativePeekAndPopleView
            // Renders nothing and inside view bound to the screen used by controller
            style={{ width: 0, height: 0 }}
            onDisappear={this.onDisappear}
            onPeek={this.onPeek}
            onPop={this.props.onPop}
            ref={this.preview}
            previewActions={this.state.traversedActions}
            onAction={this.onActionsEvent}
          >
            <View style={{ width, height }}>
              {this.state.visible ? this.props.renderPreview() : null}
            </View>
          </NativePeekAndPopleView>
          {this.props.children}
        </View>
      </React.Fragment>
    );
  }
}
