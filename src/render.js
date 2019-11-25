import { updateQueue, performWork, HOST_ROOT, CLASS_COMPONENT } from './fiber';

export function render(elements, container) {
  updateQueue.push({
    from: HOST_ROOT,
    dom: container,
    newProps: { children: elements }
  });

  requestIdleCallback(performWork);
}

export function scheduleUpdate(instance, partialState) {
  updateQueue.push({
    from: CLASS_COMPONENT,
    instance,
    partialState,
  });

  requestIdleCallback(performWork);
}
