import { get as getInstance } from './ReactInstanceMap';

export class Component {
  constructor(props) {
    this.props = props;
    this.state = {};
  }

  setState(partialState) {
    const internalInstance = getInstance(this);

    // batch state changes
    internalInstance._pendingPartialState = internalInstance._pendingPartialState || [];
    internalInstance._pendingPartialState.push(partialState);

    if (!internalInstance._rendering) {
      internalInstance.receive(internalInstance.currentElement);
    }
  }
}
