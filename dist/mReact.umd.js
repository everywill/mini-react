(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.mReact = {}));
}(this, (function (exports) { 'use strict';

  function set(key, value) {
    key.__reactInternalInstance = value;
  }

  function get(key) {
    return key.__reactInternalInstance;
  }

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

      set(publicInstance, this);

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

  const TEXT_ELEMENT = 'TEXT ELEMENT';

  function createElement(type, config, ...args) {
    const props = Object.assign({}, config);
    const hasChildren = args.length > 0;
    const rawChildren = hasChildren ? [].concat(...args) : [];
    props.children = rawChildren
      .filter(c => Boolean(c))
      .map(c => c instanceof Object ? c : createTextElement(c));
    return { type, props };
  }

  function createTextElement(value) {
    return createElement(TEXT_ELEMENT, { nodeValue: value });
  }

  const isListener = name => name.startsWith('on');
  const isAttribute = name => !isListener(name) && name !== 'children';

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

      if (type === TEXT_ELEMENT) {
        node = document.createTextNode(props.nodeValue);
      } else {
        node = document.createElement(type);

        Object.keys(props).forEach(propName => {
          if (isListener(propName)) {
            const eventType = propName.toLowerCase().substring(2);
            node.addEventListener(eventType, props[propName]);
          }
          if (isAttribute(propName)) {
            node[propName] = props[propName];
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
        if (isListener(propName)) {
          const eventType = propName.toLowerCase().substring(2);
          node.removeEventListener(eventType, prevProps[propName]);
        }
        if (isAttribute(propName) && !nextProps.hasOwnProperty(propName)) {
          node[propName] = null;
        }
      });

      // update properties
      Object.keys(nextProps).forEach(propName => {
        if (isListener(propName)) {
          const eventType = propName.toLowerCase().substring(2);
          node.addEventListener(eventType, nextProps[propName]);
        }
        if (isAttribute(propName)) {
          node[propName] = nextProps[propName];
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

  function instantiateComponent(element) {
    const type = element.type;

    if (typeof type === 'function') {
      return new CompositeComponent(element);
    } else if (typeof type === 'string') {
      return new DOMComponent(element);
    }
  }

  function mountTree(element, containerNode) {
    if (containerNode.firstChild) {
      const prevNode = containerNode.firstChild;
      const prevRootComponent = prevNode._internalInstance;
      const prevElement = prevRootComponent.currentElement;

      if (prevElement.type === element.type) {
        prevRootComponent.receive(element);
        return;
      }

      unmountTree(containerNode);
    }

    const rootComponent = instantiateComponent(element);
    const node = rootComponent.mount();
    containerNode.appendChild(node);

    node._internalInstance = rootComponent;

    const publicInstance = rootComponent.getPublicInstance();
    return publicInstance;
  }

  function unmountTree(containerNode) {
    const node = containerNode.firstChild;
    const rootComponent = node._internalInstance;

    rootComponent.unmount();
    containerNode.innerHTML = '';
  }

  class Component {
    constructor(props) {
      this.props = props;
      this.state = {};
    }

    setState(partialState) {
      const internalInstance = get(this);

      // batch state changes
      internalInstance._pendingPartialState = internalInstance._pendingPartialState || [];
      internalInstance._pendingPartialState.push(partialState);

      if (!internalInstance._rendering) {
        internalInstance.receive(internalInstance.currentElement);
      }
    }
  }

  Component.prototype.isReactComponent = true;

  var index = {
    render: mountTree,
    Component,
    createElement,
  };

  exports.Component = Component;
  exports.createElement = createElement;
  exports.default = index;
  exports.render = mountTree;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
