'use strict';

module.exports = {
  _before: function() {
    const clientInfo = this.getClientInfo();
    const secretType = clientInfo && clientInfo.secretType;
    if (secretType !== 'both') {
      throw new Error('Permission denied');
    }
  },
  get(param1) {
    if (!param1) {
      return {
        errCode: 'PARAM_IS_NULL',
        errMsg: 'Invalid parameter'
      };
    }
    return {
      param1
    };
  }
};
