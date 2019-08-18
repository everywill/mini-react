export default {
  set(key, value) {
    key.__reactInternalInstance = value;
  },
  get(key) {
    return key.__reactInternalInstance;
  },
};
