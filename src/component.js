import { scheduleUpdate } from './render';

export class Component {
  constructor(props) {
    this.props = props || {};
    this.state = this.state || {};
  }

  setState(partialState) {
    scheduleUpdate(this, partialState);
  }
}

export function createInstance(wipFiber) {
  const instance = new wipFiber.type(wipFiber.props);
  instance.__fiber = wipFiber;
  return instance;
}
