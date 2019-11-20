import instantiateComponent from './instantiateReactCompoenent';
import { TEXT_ELEMENT } from './element';

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
    return this.node;
  }

  mount() {
    const element = this.currentElement;
    const type = element.type;
    const props = element.props;
    let children = props.children || [];

    if (!Array.isArray(children)) {
      children = [children];
    }

    let node;

    if (type === 'TEXT_ELEMENT') {
      node = document.createTextNode(props.nodeValue);
    } else {
      node = document.createElement(type);

      Object.keys(props).forEach(propName => {
        if (propName !== 'children') {
          node.setAttribute(propName, props[propName]);
        }
      });
    }

    this.node = node;

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

    // some existing properties removed
    Object.keys(prevProps).forEach(propName => {
      if (propName !== 'children' && !nextProps.hasOwnProperty(propName)) {
        node.removeAttribute(propName);
      }
    });

    // update properties
    Object.keys(nextProps).forEach(propName => {
      if (propName !== 'children') {
        node.setAttribute(propName, nextProps[propName]);
      }
    });

    let prevChildren = prevProps.children || [];
    if (!Array.isArray(prevChildren)) {
      prevChildren = [prevChildren];
    }

    let nextChildren = nextProps.children || [];
    if (!Array.isArray(nextChildren)) {
      nextChildren = [nextChildren];
    }

    const prevRenderedChildren = this.renderedChildren;
    const nextRenderedChildren = [];

    const operationQueue = [];

    for (let i = 0; i < nextChildren.length; i++) {
      const prevChild = prevRenderedChildren[i];

      // some children new
      if (!prevChild) {
        const nextChild = instantiateComponent(nextChildren[i]);
        const newNode = nextChild.mount();

        operationQueue.push({ type: 'ADD', newNode });
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
    }

    // some children removed
    for (let j = nextChildren.length; j < prevChildren.length; j++) {
      const prevChild = prevRenderedChildren[j];
      const oldNode = prevChild.getHostNode();
      prevChild.unmount();

      operationQueue.push({ type: 'REMOVE', oldNode });
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

export default DOMComponent;
