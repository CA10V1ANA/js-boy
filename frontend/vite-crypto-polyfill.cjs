const nodeCrypto = require('node:crypto');

if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto.getRandomValues = (array) => nodeCrypto.randomFillSync(array);
}

if (typeof globalThis.crypto.randomUUID !== 'function' && typeof nodeCrypto.randomUUID === 'function') {
  globalThis.crypto.randomUUID = () => nodeCrypto.randomUUID();
}

