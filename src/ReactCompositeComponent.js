import instantiateComponent from './instantiateReactCompoenent';

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

    const renderedComponent = instantiateComponent(renderedElement);
    this.renderedComponent = renderedComponent;

    return renderedComponent.mount();
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

  receive(nextElement) {
    const prevProps = this.currentElement.props;
    const publicInstance = this.publicInstance;
    const prevRenderedComponent = this.renderedComponent;
    const prevRenderedElement = prevRenderedComponent.currentElement;

    this.currentElement = nextElement;
    const type = nextElement.type;
    const nextProps = nextElement.props;

    let nextRenderedElement;
    if (isClass(type)) {
      if (publicInstance.componentWillUpdate) {
        publicInstance.componentWillUpdate(nextProps);
      }

      publicInstance.props = nextProps;
      nextRenderedElement = publicInstance.render();
    } else if (typeof type === 'function') {
      nextRenderedElement = type(nextProps);
    }

    if (prevRenderedElement.type === nextRenderedElement.type) {
      prevRenderedComponent.receive(nextRenderedElement);
      return;
    }

    const prevNode = prevRenderedComponent.getHostNode();

    prevRenderedComponent.unmount();
    const nextRenderedComponent = instantiateComponent(nextRenderedElement);
    const nextNode = nextRenderedComponent.mount();

    this.renderedComponent = nextRenderedComponent;

    prevNode.parentNode.replaceChild(nextNode, prevNode);
  }
}

export default CompositeComponent;
