'use strict';

function disabled() {
  return {
    code: 'DEMO_DISABLED',
    message: 'Demo cloud object is disabled in this project.'
  };
}

module.exports = {
  async add() {
    return disabled();
  },
  async remove() {
    return disabled();
  },
  async update() {
    return disabled();
  },
  async get() {
    return disabled();
  },
  async useCommon() {
    return disabled();
  }
};
