'use strict';

exports.main = async (event, context) => {
  if (context.secretType !== 'both') {
    return { code: 'FORBIDDEN', message: 'Permission denied.' };
  }
  return {
    code: 0,
    data: {
      received: Boolean(event)
    }
  };
};
