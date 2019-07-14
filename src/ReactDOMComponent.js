import instantiateComponent from './instantiateReactCompoenent';

class DOMComponent {
  constructor(element) {
    this.currentElement = element;
    this.renderedChildren = [];
    this.node = null;
  }

  getPublicInstance() {
    return this.node;
  }

  getHostNode() {
    return this.node();
  }

  mount() {
    const element = this.currentElement;
    const type = element.type;
    const props = element.props;
    let children = props.children || [];

    if (!Array.isArray(children)) {
      children = [children];
    }

    const node = document.createElement(type);
    this.node = node;

    Object.keys(props).forEach(propName => {
      if (propName !== 'children') {
        node.setAttribute(propName, props[propName]);
      }
    });

    const renderedChildren = children.map(instantiateComponent);
    this.renderedChildren = renderedChildren;

    const childNodes = renderedChildren.map(child => child.mount());
    childNodes.forEach(childNode => node.appendChild(childNode));

    return node;
  }

  unmount() {
    const renderedChildren = this.renderedChildren;
    renderedChildren.forEach(child => child.unmount());
  }

  receive(nextElement) {
    const node = this.node;
    const prevElement = this.currentElement;
    const prevProps = prevElement.props;
    const nextProps = nextElement.props;
    this.currentElement = nextElement;

    Object.keys(prevProps).forEach(propName => {
      if (propName !== 'children' && !nextProps.hasOwnProperty(propName)) {
        node.removeAttribute(propName);
      }
    });

    Object.keys(nextProps).forEach(propName => {
      if (propName !== 'children') {
        node.setAttribute(propName, nextProps[propName]);
      }
    });

    const prevChildren = prevProps.children || [];
    if (!Array.isArray(prevChildren)) {
      prevChildren = [prevChildren];
    }

    const nextChildren = nextProps.children || [];
    if (!Array.isArray(nextChildren)) {
      nextChildren = [nextChildren];
    }

    const prevRenderedChildren = this.renderedChildren;
    const nextRenderedChildren = [];

    const operationQueue = [];

    for (let i = 0; i < nextChildren.length; i++) {
      const prevChild = prevRenderedChildren[i];

      if (!prevChild) {
        const nextChild = instantiateComponent(nextChildren[i]);
        const node = nextChild.mount();

        operationQueue.push({ type: 'ADD', node });
        nextRenderedChildren.push(nextChild);
        continue;
      }

      const canUpdate = prevChildren[i].type === nextChildren[i].type;

      if (!canUpdate) {
        const prevNode = prevChild.getHostNode();
        prevChild.unmount();

        const nextChild = instantiateComponent(nextChildren[i]);
        const nextNode = nextChild.mount();

        operationQueue.push({ type: 'REPLACE', prevNode, nextNode });
        nextRenderedChildren.push(nextChild);
        continue;
      }

      prevChild.receive(nextChildren[i]);
      nextRenderedChildren.push(prevChild);

      for (let j = nextChildren.length; j < prevChildren.length; j++) {
        const prevChild = prevRenderedChildren[j];
        const node = prevChild.getHostNode();
        prevChild.unmount();

        operationQueue.push({ type: 'REMOVE', node });
      }

      this.renderedChildren = nextRenderedChildren;

      while (operationQueue.length > 0) {
        const operation = operationQueue.shift();
        switch (operation.type) {
          case 'ADD':
            this.node.appendChild(operation.node);
            break;
          case 'REPLACE':
            this.node.replaceChild(operation.nextNode, operation.prevNode);
            break;
          case 'REMOVE':
            this.node.removeChild(operation.node);
            break;
        }
      }
    }
  }
}

export default DOMComponent;
