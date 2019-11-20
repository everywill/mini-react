export function set(key, value) {
  key.__reactInternalInstance = value;
}

export function get(key) {
  return key.__reactInternalInstance;
}
