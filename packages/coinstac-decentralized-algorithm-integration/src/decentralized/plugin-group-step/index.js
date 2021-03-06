// the following DecentralizedComputation is the same as group-add, but uses
// the group add plugin to enforce user synchronous stepping.

'use strict';

module.exports = {
  name: 'group-step',
  version: '0.0.1',
  plugins: ['group-step'],
  local: [
    {
      type: 'function',
      fn: function (opts) {
        const value = (opts.previousData || 25) + 1;
        console.log(value);
        return value;
      },
    },
  ],
  remote: {
    type: 'function',
    fn(opts) {
      let value = (opts.previousData || 0) + 1;
      console.log(value);
      if (value === 5) {
        value = { complete: true };
      }
      return value;
    },
  },
};
