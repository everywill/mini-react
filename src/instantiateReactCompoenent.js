import CompositeComponent from './ReactCompositeComponent';
import DOMComponent from './ReactDOMComponent';

function instantiateComponent(element) {
  const type = element.type;

  if (typeof type === 'function') {
    return new CompositeComponent(element);
  } else if (typeof type === 'string') {
    return new DOMComponent(element);
  }
}

export default instantiateComponent;
