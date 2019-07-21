'use strict';

const wrappers = {
  default(source) {
    return `'use strict';
    ${source}`;
  },
};

function wrapBundle(source) {
  const wrapper = wrappers['default'];

  return wrapper(source);
}

module.exports = {
  wrapBundle,
};
