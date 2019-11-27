import instantiateComponent from './instantiateReactCompoenent';
import { set as setInstance } from './ReactInstanceMap';

function isClass(type) {
  return (
    Boolean(type.prototype) &&
    Boolean(type.prototype.isReactComponent)
  );
}

class CompositeComponent {
  constructor(element) {
    this.currentElement = element;
    this.renderedComponent = null;
    this.publicInstance = null;
  }

  getPublicInstance() {
    return this.publicInstance;
  }

  getHostNode() {
    return this.renderedComponent.getHostNode();
  }

  mount() {
    const element = this.currentElement;
    const type = element.type;
    const props = element.props;

    let publicInstance;
    let renderedElement;

    if (isClass(type)) {
      publicInstance = new type(props);
      publicInstance.props = props;

      if (publicInstance.componentWillMount) {
        publicInstance.componentWillMount();
      }
      renderedElement = publicInstance.render();
    } else if (typeof type === 'function') {
      publicInstance = null;
      renderedElement = type(props);
    }

    this.publicInstance = publicInstance;

    setInstance(publicInstance, this);

    const renderedComponent = instantiateComponent(renderedElement);
    this.renderedComponent = renderedComponent;

    const markUp = renderedComponent.mount();

    if (publicInstance && publicInstance.componentDidMount) {
      publicInstance.componentDidMount();
    }

    return markUp;
  }

  unmount() {
    const publicInstance = this.publicInstance;
    if (publicInstance) {
      if (publicInstance.componentWillUnmount) {
        publicInstance.componentWillUnmount();
      }
    }

    const renderedComponent = this.renderedComponent;
    renderedComponent.unmount();
  }

  // update
  receive(nextElement) {
    this._rendering = true;

    // const prevProps = this.currentElement.props;
    const publicInstance = this.publicInstance;
    const prevRenderedComponent = this.renderedComponent;
    const prevRenderedElement = prevRenderedComponent.currentElement;

    // equation means updating is from setState
    const willReceive = this.currentElement !== nextElement;

    this.currentElement = nextElement;
    const type = nextElement.type;
    const nextProps = nextElement.props;

    let nextRenderedElement;

    if (willReceive && publicInstance.componentWillReceiveProps) {
      publicInstance.componentWillReceiveProps(nextProps);
    }

    let shouldUpdate = true;
    const nextState = this._processPendingState();
    this._pendingPartialState = null;

    if (publicInstance.shouldComponentUpdate) {
      shouldUpdate = publicInstance.shouldComponentUpdate(nextProps, nextState);
    }

    if (shouldUpdate) {
      if (isClass(type)) {
        if (publicInstance.componentWillUpdate) {
          publicInstance.componentWillUpdate(nextProps);
        }

        publicInstance.props = nextProps;
        publicInstance.state = nextState;
        nextRenderedElement = publicInstance.render();
      } else if (typeof type === 'function') {
        nextRenderedElement = type(nextProps);
      }

      // type相同
      if (prevRenderedElement.type === nextRenderedElement.type) {
        prevRenderedComponent.receive(nextRenderedElement);
        return;
      }

      const prevNode = prevRenderedComponent.getHostNode();

      // type不同
      prevRenderedComponent.unmount();
      const nextRenderedComponent = instantiateComponent(nextRenderedElement);
      const nextNode = nextRenderedComponent.mount();

      this.renderedComponent = nextRenderedComponent;

      prevNode.parentNode.replaceChild(nextNode, prevNode);
    } else {
      publicInstance.props = nextProps;
      publicInstance.state = nextState;
    }

    this._rendering = false;
  }

  _processPendingState() {
    const publicInstance = this.publicInstance;
    if (!this._pendingPartialState) {
      return publicInstance.state;
    }

    let nextState = publicInstance.state;

    for (let i = 0; i < this._pendingPartialState.length; i++) {
      nextState = Object.assign(nextState, this._pendingPartialState[i]);
    }

    this._pendingPartialState = null;
    return nextState;
  }
}

export default CompositeComponent;
