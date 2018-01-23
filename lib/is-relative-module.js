'use strict';

const regex = /^(\.|\.\.)(\/.+|$)/;

module.exports = filename => regex.test(filename);
