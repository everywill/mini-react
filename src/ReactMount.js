import instantiateComponent from './instantiateReactCompoenent';

export function mountTree(element, containerNode) {
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

export function unmountTree(containerNode) {
  const node = containerNode.firstChild;
  const rootComponent = node._internalInstance;

  rootComponent.unmount();
  containerNode.innerHTML = '';
}
