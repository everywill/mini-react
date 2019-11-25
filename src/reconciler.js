import { HOST_COMPONENT, CLASS_COMPONENT } from './fiber';
import { createInstance } from './component';

// effect tags
export const PLACEMENT = 1;
export const DELETION = 2;
export const UPDATE = 3;

function cloneChildFibers(parentFiber) {
  const oldParentFiber = parentFiber.alternate;
  if (!oldParentFiber.child) {
    return;
  }

  let oldChildFiber = oldParentFiber.child;
  let prevFiber = null;

  while(oldChildFiber) {
    const newChildFiber = {
      type: oldChildFiber.type,
      tag: oldChildFiber.tag,
      stateNode: oldChildFiber.stateNode,
      props: oldChildFiber.props,
      partialState: oldChildFiber.partialState,
      alternate: oldChildFiber,
      parent: parentFiber,
    };

    if (prevFiber) {
      prevFiber.sibling = newChildFiber;
    } else {
      parentFiber.child = newChildFiber;
    }

    prevFiber = newChildFiber;
    oldChildFiber = oldChildFiber.sibling;
  }
}

export function updateClassComponent(wipFiber) {
  let instance = wipFiber.stateNode;
  if (instance === null) {
    // first render
    instance = wipFiber.stateNode = createInstance(wipFiber);
  } else if (wipFiber.props === instance.props && !wipFiber.partialState) {
    cloneChildFibers(wipFiber);
    return;
  }

  instance.props = wipFiber.props;
  instance.state = Object.assign({}, instance.state, wipFiber.partialState);
  wipFiber.partialState = null;

  const newChildElements = wipFiber.stateNode.render();
  reconcileChildrenArray(wipFiber, newChildElements);
}

export function updateHostComponent(wipFiber) {
  const newChildElements = wipFiber.props.children;
  reconcileChildrenArray(wipFiber, newChildElements);
}

function reconcileChildrenArray(wipFiber, newChildElements) {
  const elements = arrify(newChildElements);

  let index = 0;
  let oldChildFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  let newChildFiber = null;

  while (index < elements.length || oldChildFiber !== null) {
    const prevChildFiber = newChildFiber;
    const element = index < elements.length && elements[index];
    const sameType = oldChildFiber && element && oldChildFiber.type === element.type;

    if (sameType) {
      // build newChildFiber based on oldChildFiber
      newChildFiber = {
        type: oldChildFiber.type,
        tag: oldChildFiber.tag,
        stateNode: oldChildFiber.stateNode,
        props: element.props,
        parent: wipFiber,
        alternate: oldChildFiber,
        partialState: oldChildFiber.partialState,
        effectTag: UPDATE,
      }
    }

    if (!sameType && element) {
      // type changes and there is a element, place a newChildFiber
      newChildFiber = {
        type: element.type,
        tag: typeof element.type === 'string' ? HOST_COMPONENT : CLASS_COMPONENT,
        props: element.props,
        parent: wipFiber,
        effectTag: PLACEMENT,
      }
    }

    if (!sameType && oldChildFiber) {
      // type changes and there was a oldChildFiber
      oldChildFiber.effectTag = DELETION;
      wipFiber.effects = wipFiber.effects || [];
      wipFiber.effects.push(oldChildFiber);
    }

    if (index == 0) {
      // link first newChildFiber to parent
      wipFiber.child = newChildFiber;
    } else if (prevFiber && element) {
      // link siblings
      prevChildFiber.sibling = newChildFiber;
    }

    if (oldChildFiber) {
      oldChildFiber = oldChildFiber.sibling;
    }

    index ++;
  }
}

function arrify(val) {
  return val === null ? [] : Array.isArray(val) ? val : [val];
}
