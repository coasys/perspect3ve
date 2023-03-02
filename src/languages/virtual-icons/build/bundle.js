'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _agent, _IPFS;
class IpfsPutAdapter {
    constructor(context) {
        _agent.set(this, void 0);
        _IPFS.set(this, void 0);
        __classPrivateFieldSet(this, _agent, context.agent);
        __classPrivateFieldSet(this, _IPFS, context.IPFS);
    }
    async createPublic(note) {
        try {
            //@ts-ignore
            note = JSON.parse(note);
        }
        catch (e) {
        }
        const agent = __classPrivateFieldGet(this, _agent);
        const expression = agent.createSignedExpression(note);
        const content = JSON.stringify(expression);
        const result = await __classPrivateFieldGet(this, _IPFS).add({ content });
        // @ts-ignore
        return result.cid.toString();
    }
}
_agent = new WeakMap(), _IPFS = new WeakMap();

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

function base(ALPHABET, name) {
  if (ALPHABET.length >= 255) {
    throw new TypeError('Alphabet too long');
  }
  var BASE_MAP = new Uint8Array(256);
  for (var j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255;
  }
  for (var i = 0; i < ALPHABET.length; i++) {
    var x = ALPHABET.charAt(i);
    var xc = x.charCodeAt(0);
    if (BASE_MAP[xc] !== 255) {
      throw new TypeError(x + ' is ambiguous');
    }
    BASE_MAP[xc] = i;
  }
  var BASE = ALPHABET.length;
  var LEADER = ALPHABET.charAt(0);
  var FACTOR = Math.log(BASE) / Math.log(256);
  var iFACTOR = Math.log(256) / Math.log(BASE);
  function encode(source) {
    if (source instanceof Uint8Array);
    else if (ArrayBuffer.isView(source)) {
      source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    } else if (Array.isArray(source)) {
      source = Uint8Array.from(source);
    }
    if (!(source instanceof Uint8Array)) {
      throw new TypeError('Expected Uint8Array');
    }
    if (source.length === 0) {
      return '';
    }
    var zeroes = 0;
    var length = 0;
    var pbegin = 0;
    var pend = source.length;
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++;
      zeroes++;
    }
    var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
    var b58 = new Uint8Array(size);
    while (pbegin !== pend) {
      var carry = source[pbegin];
      var i = 0;
      for (var it1 = size - 1; (carry !== 0 || i < length) && it1 !== -1; it1--, i++) {
        carry += 256 * b58[it1] >>> 0;
        b58[it1] = carry % BASE >>> 0;
        carry = carry / BASE >>> 0;
      }
      if (carry !== 0) {
        throw new Error('Non-zero carry');
      }
      length = i;
      pbegin++;
    }
    var it2 = size - length;
    while (it2 !== size && b58[it2] === 0) {
      it2++;
    }
    var str = LEADER.repeat(zeroes);
    for (; it2 < size; ++it2) {
      str += ALPHABET.charAt(b58[it2]);
    }
    return str;
  }
  function decodeUnsafe(source) {
    if (typeof source !== 'string') {
      throw new TypeError('Expected String');
    }
    if (source.length === 0) {
      return new Uint8Array();
    }
    var psz = 0;
    if (source[psz] === ' ') {
      return;
    }
    var zeroes = 0;
    var length = 0;
    while (source[psz] === LEADER) {
      zeroes++;
      psz++;
    }
    var size = (source.length - psz) * FACTOR + 1 >>> 0;
    var b256 = new Uint8Array(size);
    while (source[psz]) {
      var carry = BASE_MAP[source.charCodeAt(psz)];
      if (carry === 255) {
        return;
      }
      var i = 0;
      for (var it3 = size - 1; (carry !== 0 || i < length) && it3 !== -1; it3--, i++) {
        carry += BASE * b256[it3] >>> 0;
        b256[it3] = carry % 256 >>> 0;
        carry = carry / 256 >>> 0;
      }
      if (carry !== 0) {
        throw new Error('Non-zero carry');
      }
      length = i;
      psz++;
    }
    if (source[psz] === ' ') {
      return;
    }
    var it4 = size - length;
    while (it4 !== size && b256[it4] === 0) {
      it4++;
    }
    var vch = new Uint8Array(zeroes + (size - it4));
    var j = zeroes;
    while (it4 !== size) {
      vch[j++] = b256[it4++];
    }
    return vch;
  }
  function decode(string) {
    var buffer = decodeUnsafe(string);
    if (buffer) {
      return buffer;
    }
    throw new Error(`Non-${ name } character`);
  }
  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  };
}
var src = base;
var _brrp__multiformats_scope_baseX = src;

var baseX = _brrp__multiformats_scope_baseX;

var bytes = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

const empty = new Uint8Array(0);
const toHex = d => d.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');
const fromHex = hex => {
  const hexes = hex.match(/../g);
  return hexes ? new Uint8Array(hexes.map(b => parseInt(b, 16))) : empty;
};
const equals = (aa, bb) => {
  if (aa === bb)
    return true;
  if (aa.byteLength !== bb.byteLength) {
    return false;
  }
  for (let ii = 0; ii < aa.byteLength; ii++) {
    if (aa[ii] !== bb[ii]) {
      return false;
    }
  }
  return true;
};
const coerce = o => {
  if (o instanceof Uint8Array && o.constructor.name === 'Uint8Array')
    return o;
  if (o instanceof ArrayBuffer)
    return new Uint8Array(o);
  if (ArrayBuffer.isView(o)) {
    return new Uint8Array(o.buffer, o.byteOffset, o.byteLength);
  }
  throw new Error('Unknown type, must be binary type');
};
const isBinary = o => o instanceof ArrayBuffer || ArrayBuffer.isView(o);
const fromString = str => new TextEncoder().encode(str);
const toString = b => new TextDecoder().decode(b);

exports.coerce = coerce;
exports.empty = empty;
exports.equals = equals;
exports.fromHex = fromHex;
exports.fromString = fromString;
exports.isBinary = isBinary;
exports.toHex = toHex;
exports.toString = toString;
});

var base$1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });




class Encoder {
  constructor(name, prefix, baseEncode) {
    this.name = name;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
  }
  encode(bytes) {
    if (bytes instanceof Uint8Array) {
      return `${ this.prefix }${ this.baseEncode(bytes) }`;
    } else {
      throw Error('Unknown type, must be binary type');
    }
  }
}
class Decoder {
  constructor(name, prefix, baseDecode) {
    this.name = name;
    this.prefix = prefix;
    this.baseDecode = baseDecode;
  }
  decode(text) {
    if (typeof text === 'string') {
      switch (text[0]) {
      case this.prefix: {
          return this.baseDecode(text.slice(1));
        }
      default: {
          throw Error(`Unable to decode multibase string ${ JSON.stringify(text) }, ${ this.name } decoder only supports inputs prefixed with ${ this.prefix }`);
        }
      }
    } else {
      throw Error('Can only multibase decode strings');
    }
  }
  or(decoder) {
    return or(this, decoder);
  }
}
class ComposedDecoder {
  constructor(decoders) {
    this.decoders = decoders;
  }
  or(decoder) {
    return or(this, decoder);
  }
  decode(input) {
    const prefix = input[0];
    const decoder = this.decoders[prefix];
    if (decoder) {
      return decoder.decode(input);
    } else {
      throw RangeError(`Unable to decode multibase string ${ JSON.stringify(input) }, only inputs prefixed with ${ Object.keys(this.decoders) } are supported`);
    }
  }
}
const or = (left, right) => new ComposedDecoder({
  ...left.decoders || { [left.prefix]: left },
  ...right.decoders || { [right.prefix]: right }
});
class Codec {
  constructor(name, prefix, baseEncode, baseDecode) {
    this.name = name;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
    this.baseDecode = baseDecode;
    this.encoder = new Encoder(name, prefix, baseEncode);
    this.decoder = new Decoder(name, prefix, baseDecode);
  }
  encode(input) {
    return this.encoder.encode(input);
  }
  decode(input) {
    return this.decoder.decode(input);
  }
}
const from = ({name, prefix, encode, decode}) => new Codec(name, prefix, encode, decode);
const baseX$1 = ({prefix, name, alphabet}) => {
  const {encode, decode} = baseX(alphabet, name);
  return from({
    prefix,
    name,
    encode,
    decode: text => bytes.coerce(decode(text))
  });
};
const decode = (string, alphabet, bitsPerChar, name) => {
  const codes = {};
  for (let i = 0; i < alphabet.length; ++i) {
    codes[alphabet[i]] = i;
  }
  let end = string.length;
  while (string[end - 1] === '=') {
    --end;
  }
  const out = new Uint8Array(end * bitsPerChar / 8 | 0);
  let bits = 0;
  let buffer = 0;
  let written = 0;
  for (let i = 0; i < end; ++i) {
    const value = codes[string[i]];
    if (value === undefined) {
      throw new SyntaxError(`Non-${ name } character`);
    }
    buffer = buffer << bitsPerChar | value;
    bits += bitsPerChar;
    if (bits >= 8) {
      bits -= 8;
      out[written++] = 255 & buffer >> bits;
    }
  }
  if (bits >= bitsPerChar || 255 & buffer << 8 - bits) {
    throw new SyntaxError('Unexpected end of data');
  }
  return out;
};
const encode = (data, alphabet, bitsPerChar) => {
  const pad = alphabet[alphabet.length - 1] === '=';
  const mask = (1 << bitsPerChar) - 1;
  let out = '';
  let bits = 0;
  let buffer = 0;
  for (let i = 0; i < data.length; ++i) {
    buffer = buffer << 8 | data[i];
    bits += 8;
    while (bits > bitsPerChar) {
      bits -= bitsPerChar;
      out += alphabet[mask & buffer >> bits];
    }
  }
  if (bits) {
    out += alphabet[mask & buffer << bitsPerChar - bits];
  }
  if (pad) {
    while (out.length * bitsPerChar & 7) {
      out += '=';
    }
  }
  return out;
};
const rfc4648 = ({name, prefix, bitsPerChar, alphabet}) => {
  return from({
    prefix,
    name,
    encode(input) {
      return encode(input, alphabet, bitsPerChar);
    },
    decode(input) {
      return decode(input, alphabet, bitsPerChar, name);
    }
  });
};

exports.Codec = Codec;
exports.baseX = baseX$1;
exports.from = from;
exports.or = or;
exports.rfc4648 = rfc4648;
});

var identity_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });




const identity = base$1.from({
  prefix: '\0',
  name: 'identity',
  encode: buf => bytes.toString(buf),
  decode: str => bytes.fromString(str)
});

exports.identity = identity;
});

var base2_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const base2 = base$1.rfc4648({
  prefix: '0',
  name: 'base2',
  alphabet: '01',
  bitsPerChar: 1
});

exports.base2 = base2;
});

var base8_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const base8 = base$1.rfc4648({
  prefix: '7',
  name: 'base8',
  alphabet: '01234567',
  bitsPerChar: 3
});

exports.base8 = base8;
});

var base10_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const base10 = base$1.baseX({
  prefix: '9',
  name: 'base10',
  alphabet: '0123456789'
});

exports.base10 = base10;
});

var base16_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const base16 = base$1.rfc4648({
  prefix: 'f',
  name: 'base16',
  alphabet: '0123456789abcdef',
  bitsPerChar: 4
});
const base16upper = base$1.rfc4648({
  prefix: 'F',
  name: 'base16upper',
  alphabet: '0123456789ABCDEF',
  bitsPerChar: 4
});

exports.base16 = base16;
exports.base16upper = base16upper;
});

var base32_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const base32 = base$1.rfc4648({
  prefix: 'b',
  name: 'base32',
  alphabet: 'abcdefghijklmnopqrstuvwxyz234567',
  bitsPerChar: 5
});
const base32upper = base$1.rfc4648({
  prefix: 'B',
  name: 'base32upper',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
  bitsPerChar: 5
});
const base32pad = base$1.rfc4648({
  prefix: 'c',
  name: 'base32pad',
  alphabet: 'abcdefghijklmnopqrstuvwxyz234567=',
  bitsPerChar: 5
});
const base32padupper = base$1.rfc4648({
  prefix: 'C',
  name: 'base32padupper',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=',
  bitsPerChar: 5
});
const base32hex = base$1.rfc4648({
  prefix: 'v',
  name: 'base32hex',
  alphabet: '0123456789abcdefghijklmnopqrstuv',
  bitsPerChar: 5
});
const base32hexupper = base$1.rfc4648({
  prefix: 'V',
  name: 'base32hexupper',
  alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUV',
  bitsPerChar: 5
});
const base32hexpad = base$1.rfc4648({
  prefix: 't',
  name: 'base32hexpad',
  alphabet: '0123456789abcdefghijklmnopqrstuv=',
  bitsPerChar: 5
});
const base32hexpadupper = base$1.rfc4648({
  prefix: 'T',
  name: 'base32hexpadupper',
  alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUV=',
  bitsPerChar: 5
});
const base32z = base$1.rfc4648({
  prefix: 'h',
  name: 'base32z',
  alphabet: 'ybndrfg8ejkmcpqxot1uwisza345h769',
  bitsPerChar: 5
});

exports.base32 = base32;
exports.base32hex = base32hex;
exports.base32hexpad = base32hexpad;
exports.base32hexpadupper = base32hexpadupper;
exports.base32hexupper = base32hexupper;
exports.base32pad = base32pad;
exports.base32padupper = base32padupper;
exports.base32upper = base32upper;
exports.base32z = base32z;
});

var base36_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const base36 = base$1.baseX({
  prefix: 'k',
  name: 'base36',
  alphabet: '0123456789abcdefghijklmnopqrstuvwxyz'
});
const base36upper = base$1.baseX({
  prefix: 'K',
  name: 'base36upper',
  alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
});

exports.base36 = base36;
exports.base36upper = base36upper;
});

var base58 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const base58btc = base$1.baseX({
  name: 'base58btc',
  prefix: 'z',
  alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
});
const base58flickr = base$1.baseX({
  name: 'base58flickr',
  prefix: 'Z',
  alphabet: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
});

exports.base58btc = base58btc;
exports.base58flickr = base58flickr;
});

var base64_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const base64 = base$1.rfc4648({
  prefix: 'm',
  name: 'base64',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  bitsPerChar: 6
});
const base64pad = base$1.rfc4648({
  prefix: 'M',
  name: 'base64pad',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  bitsPerChar: 6
});
const base64url = base$1.rfc4648({
  prefix: 'u',
  name: 'base64url',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  bitsPerChar: 6
});
const base64urlpad = base$1.rfc4648({
  prefix: 'U',
  name: 'base64urlpad',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=',
  bitsPerChar: 6
});

exports.base64 = base64;
exports.base64pad = base64pad;
exports.base64url = base64url;
exports.base64urlpad = base64urlpad;
});

var encode_1 = encode;
var MSB = 128, REST = 127, MSBALL = ~REST, INT = Math.pow(2, 31);
function encode(num, out, offset) {
  out = out || [];
  offset = offset || 0;
  var oldOffset = offset;
  while (num >= INT) {
    out[offset++] = num & 255 | MSB;
    num /= 128;
  }
  while (num & MSBALL) {
    out[offset++] = num & 255 | MSB;
    num >>>= 7;
  }
  out[offset] = num | 0;
  encode.bytes = offset - oldOffset + 1;
  return out;
}
var decode = read;
var MSB$1 = 128, REST$1 = 127;
function read(buf, offset) {
  var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l = buf.length;
  do {
    if (counter >= l) {
      read.bytes = 0;
      throw new RangeError('Could not decode varint');
    }
    b = buf[counter++];
    res += shift < 28 ? (b & REST$1) << shift : (b & REST$1) * Math.pow(2, shift);
    shift += 7;
  } while (b >= MSB$1);
  read.bytes = counter - offset;
  return res;
}
var N1 = Math.pow(2, 7);
var N2 = Math.pow(2, 14);
var N3 = Math.pow(2, 21);
var N4 = Math.pow(2, 28);
var N5 = Math.pow(2, 35);
var N6 = Math.pow(2, 42);
var N7 = Math.pow(2, 49);
var N8 = Math.pow(2, 56);
var N9 = Math.pow(2, 63);
var length = function (value) {
  return value < N1 ? 1 : value < N2 ? 2 : value < N3 ? 3 : value < N4 ? 4 : value < N5 ? 5 : value < N6 ? 6 : value < N7 ? 7 : value < N8 ? 8 : value < N9 ? 9 : 10;
};
var varint = {
  encode: encode_1,
  decode: decode,
  encodingLength: length
};
var _brrp_varint = varint;
var varint$1 = _brrp_varint;

var varint_1 = varint$1;

var varint$2 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const decode = data => {
  const code = varint_1.decode(data);
  return [
    code,
    varint_1.decode.bytes
  ];
};
const encodeTo = (int, target, offset = 0) => {
  varint_1.encode(int, target, offset);
  return target;
};
const encodingLength = int => {
  return varint_1.encodingLength(int);
};

exports.decode = decode;
exports.encodeTo = encodeTo;
exports.encodingLength = encodingLength;
});

var digest = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });




const create = (code, digest) => {
  const size = digest.byteLength;
  const sizeOffset = varint$2.encodingLength(code);
  const digestOffset = sizeOffset + varint$2.encodingLength(size);
  const bytes = new Uint8Array(digestOffset + size);
  varint$2.encodeTo(code, bytes, 0);
  varint$2.encodeTo(size, bytes, sizeOffset);
  bytes.set(digest, digestOffset);
  return new Digest(code, size, digest, bytes);
};
const decode = multihash => {
  const bytes$1 = bytes.coerce(multihash);
  const [code, sizeOffset] = varint$2.decode(bytes$1);
  const [size, digestOffset] = varint$2.decode(bytes$1.subarray(sizeOffset));
  const digest = bytes$1.subarray(sizeOffset + digestOffset);
  if (digest.byteLength !== size) {
    throw new Error('Incorrect length');
  }
  return new Digest(code, size, digest, bytes$1);
};
const equals = (a, b) => {
  if (a === b) {
    return true;
  } else {
    return a.code === b.code && a.size === b.size && bytes.equals(a.bytes, b.bytes);
  }
};
class Digest {
  constructor(code, size, digest, bytes) {
    this.code = code;
    this.size = size;
    this.digest = digest;
    this.bytes = bytes;
  }
}

exports.Digest = Digest;
exports.create = create;
exports.decode = decode;
exports.equals = equals;
});

var hasher = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const from = ({name, code, encode}) => new Hasher(name, code, encode);
class Hasher {
  constructor(name, code, encode) {
    this.name = name;
    this.code = code;
    this.encode = encode;
  }
  async digest(input) {
    if (input instanceof Uint8Array) {
      const digest$1 = await this.encode(input);
      return digest.create(this.code, digest$1);
    } else {
      throw Error('Unknown type, must be binary type');
    }
  }
}

exports.Hasher = Hasher;
exports.from = from;
});

var sha2Browser = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const sha = name => async data => new Uint8Array(await crypto.subtle.digest(name, data));
const sha256 = hasher.from({
  name: 'sha2-256',
  code: 18,
  encode: sha('SHA-256')
});
const sha512 = hasher.from({
  name: 'sha2-512',
  code: 19,
  encode: sha('SHA-512')
});

exports.sha256 = sha256;
exports.sha512 = sha512;
});

var identity_1$1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });




const identity = hasher.from({
  name: 'identity',
  code: 0,
  encode: input => bytes.coerce(input)
});

exports.identity = identity;
});

var raw = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



const name = 'raw';
const code = 85;
const encode = node => bytes.coerce(node);
const decode = data => bytes.coerce(data);

exports.code = code;
exports.decode = decode;
exports.encode = encode;
exports.name = name;
});

var json = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const name = 'json';
const code = 512;
const encode = node => textEncoder.encode(JSON.stringify(node));
const decode = data => JSON.parse(textDecoder.decode(data));

exports.code = code;
exports.decode = decode;
exports.encode = encode;
exports.name = name;
});

var cid = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });







class CID {
  constructor(version, code, multihash, bytes) {
    this.code = code;
    this.version = version;
    this.multihash = multihash;
    this.bytes = bytes;
    this.byteOffset = bytes.byteOffset;
    this.byteLength = bytes.byteLength;
    this.asCID = this;
    this._baseCache = new Map();
    Object.defineProperties(this, {
      byteOffset: hidden,
      byteLength: hidden,
      code: readonly,
      version: readonly,
      multihash: readonly,
      bytes: readonly,
      _baseCache: hidden,
      asCID: hidden
    });
  }
  toV0() {
    switch (this.version) {
    case 0: {
        return this;
      }
    default: {
        const {code, multihash} = this;
        if (code !== DAG_PB_CODE) {
          throw new Error('Cannot convert a non dag-pb CID to CIDv0');
        }
        if (multihash.code !== SHA_256_CODE) {
          throw new Error('Cannot convert non sha2-256 multihash CID to CIDv0');
        }
        return CID.createV0(multihash);
      }
    }
  }
  toV1() {
    switch (this.version) {
    case 0: {
        const {code, digest: digest$1} = this.multihash;
        const multihash = digest.create(code, digest$1);
        return CID.createV1(this.code, multihash);
      }
    case 1: {
        return this;
      }
    default: {
        throw Error(`Can not convert CID version ${ this.version } to version 0. This is a bug please report`);
      }
    }
  }
  equals(other) {
    return other && this.code === other.code && this.version === other.version && digest.equals(this.multihash, other.multihash);
  }
  toString(base) {
    const {bytes, version, _baseCache} = this;
    switch (version) {
    case 0:
      return toStringV0(bytes, _baseCache, base || base58.base58btc.encoder);
    default:
      return toStringV1(bytes, _baseCache, base || base32_1.base32.encoder);
    }
  }
  toJSON() {
    return {
      code: this.code,
      version: this.version,
      hash: this.multihash.bytes
    };
  }
  get [Symbol.toStringTag]() {
    return 'CID';
  }
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return 'CID(' + this.toString() + ')';
  }
  static isCID(value) {
    deprecate(/^0\.0/, IS_CID_DEPRECATION);
    return !!(value && (value[cidSymbol] || value.asCID === value));
  }
  get toBaseEncodedString() {
    throw new Error('Deprecated, use .toString()');
  }
  get codec() {
    throw new Error('"codec" property is deprecated, use integer "code" property instead');
  }
  get buffer() {
    throw new Error('Deprecated .buffer property, use .bytes to get Uint8Array instead');
  }
  get multibaseName() {
    throw new Error('"multibaseName" property is deprecated');
  }
  get prefix() {
    throw new Error('"prefix" property is deprecated');
  }
  static asCID(value) {
    if (value instanceof CID) {
      return value;
    } else if (value != null && value.asCID === value) {
      const {version, code, multihash, bytes} = value;
      return new CID(version, code, multihash, bytes || encodeCID(version, code, multihash.bytes));
    } else if (value != null && value[cidSymbol] === true) {
      const {version, multihash, code} = value;
      const digest$1 = digest.decode(multihash);
      return CID.create(version, code, digest$1);
    } else {
      return null;
    }
  }
  static create(version, code, digest) {
    if (typeof code !== 'number') {
      throw new Error('String codecs are no longer supported');
    }
    switch (version) {
    case 0: {
        if (code !== DAG_PB_CODE) {
          throw new Error(`Version 0 CID must use dag-pb (code: ${ DAG_PB_CODE }) block encoding`);
        } else {
          return new CID(version, code, digest, digest.bytes);
        }
      }
    case 1: {
        const bytes = encodeCID(version, code, digest.bytes);
        return new CID(version, code, digest, bytes);
      }
    default: {
        throw new Error('Invalid version');
      }
    }
  }
  static createV0(digest) {
    return CID.create(0, DAG_PB_CODE, digest);
  }
  static createV1(code, digest) {
    return CID.create(1, code, digest);
  }
  static decode(bytes) {
    const [cid, remainder] = CID.decodeFirst(bytes);
    if (remainder.length) {
      throw new Error('Incorrect length');
    }
    return cid;
  }
  static decodeFirst(bytes$1) {
    const specs = CID.inspectBytes(bytes$1);
    const prefixSize = specs.size - specs.multihashSize;
    const multihashBytes = bytes.coerce(bytes$1.subarray(prefixSize, prefixSize + specs.multihashSize));
    if (multihashBytes.byteLength !== specs.multihashSize) {
      throw new Error('Incorrect length');
    }
    const digestBytes = multihashBytes.subarray(specs.multihashSize - specs.digestSize);
    const digest$1 = new digest.Digest(specs.multihashCode, specs.digestSize, digestBytes, multihashBytes);
    const cid = specs.version === 0 ? CID.createV0(digest$1) : CID.createV1(specs.codec, digest$1);
    return [
      cid,
      bytes$1.subarray(specs.size)
    ];
  }
  static inspectBytes(initialBytes) {
    let offset = 0;
    const next = () => {
      const [i, length] = varint$2.decode(initialBytes.subarray(offset));
      offset += length;
      return i;
    };
    let version = next();
    let codec = DAG_PB_CODE;
    if (version === 18) {
      version = 0;
      offset = 0;
    } else if (version === 1) {
      codec = next();
    }
    if (version !== 0 && version !== 1) {
      throw new RangeError(`Invalid CID version ${ version }`);
    }
    const prefixSize = offset;
    const multihashCode = next();
    const digestSize = next();
    const size = offset + digestSize;
    const multihashSize = size - prefixSize;
    return {
      version,
      codec,
      multihashCode,
      digestSize,
      multihashSize,
      size
    };
  }
  static parse(source, base) {
    const [prefix, bytes] = parseCIDtoBytes(source, base);
    const cid = CID.decode(bytes);
    cid._baseCache.set(prefix, source);
    return cid;
  }
}
const parseCIDtoBytes = (source, base) => {
  switch (source[0]) {
  case 'Q': {
      const decoder = base || base58.base58btc;
      return [
        base58.base58btc.prefix,
        decoder.decode(`${ base58.base58btc.prefix }${ source }`)
      ];
    }
  case base58.base58btc.prefix: {
      const decoder = base || base58.base58btc;
      return [
        base58.base58btc.prefix,
        decoder.decode(source)
      ];
    }
  case base32_1.base32.prefix: {
      const decoder = base || base32_1.base32;
      return [
        base32_1.base32.prefix,
        decoder.decode(source)
      ];
    }
  default: {
      if (base == null) {
        throw Error('To parse non base32 or base58btc encoded CID multibase decoder must be provided');
      }
      return [
        source[0],
        base.decode(source)
      ];
    }
  }
};
const toStringV0 = (bytes, cache, base) => {
  const {prefix} = base;
  if (prefix !== base58.base58btc.prefix) {
    throw Error(`Cannot string encode V0 in ${ base.name } encoding`);
  }
  const cid = cache.get(prefix);
  if (cid == null) {
    const cid = base.encode(bytes).slice(1);
    cache.set(prefix, cid);
    return cid;
  } else {
    return cid;
  }
};
const toStringV1 = (bytes, cache, base) => {
  const {prefix} = base;
  const cid = cache.get(prefix);
  if (cid == null) {
    const cid = base.encode(bytes);
    cache.set(prefix, cid);
    return cid;
  } else {
    return cid;
  }
};
const DAG_PB_CODE = 112;
const SHA_256_CODE = 18;
const encodeCID = (version, code, multihash) => {
  const codeOffset = varint$2.encodingLength(version);
  const hashOffset = codeOffset + varint$2.encodingLength(code);
  const bytes = new Uint8Array(hashOffset + multihash.byteLength);
  varint$2.encodeTo(version, bytes, 0);
  varint$2.encodeTo(code, bytes, codeOffset);
  bytes.set(multihash, hashOffset);
  return bytes;
};
const cidSymbol = Symbol.for('@ipld/js-cid/CID');
const readonly = {
  writable: false,
  configurable: false,
  enumerable: true
};
const hidden = {
  writable: false,
  enumerable: false,
  configurable: false
};
const version = '0.0.0-dev';
const deprecate = (range, message) => {
  if (range.test(version)) {
    console.warn(message);
  } else {
    throw new Error(message);
  }
};
const IS_CID_DEPRECATION = `CID.isCID(v) is deprecated and will be removed in the next major release.
Following code pattern:

if (CID.isCID(value)) {
  doSomethingWithCID(value)
}

Is replaced with:

const cid = CID.asCID(value)
if (cid) {
  // Make sure to use cid instead of value
  doSomethingWithCID(cid)
}
`;

exports.CID = CID;
});

var src$1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });









exports.CID = cid.CID;
exports.varint = varint$2;
exports.bytes = bytes;
exports.hasher = hasher;
exports.digest = digest;
});

var basics = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });





















const bases = {
  ...identity_1,
  ...base2_1,
  ...base8_1,
  ...base10_1,
  ...base16_1,
  ...base32_1,
  ...base36_1,
  ...base58,
  ...base64_1
};
const hashes = {
  ...sha2Browser,
  ...identity_1$1
};
const codecs = {
  raw,
  json
};

exports.CID = cid.CID;
exports.hasher = hasher;
exports.digest = digest;
exports.varint = varint$2;
exports.bytes = bytes;
exports.bases = bases;
exports.codecs = codecs;
exports.hashes = hashes;
});

function createCodec(name, prefix, encode, decode) {
  return {
    name,
    prefix,
    encoder: {
      name,
      prefix,
      encode
    },
    decoder: { decode }
  };
}
const string = createCodec('utf8', 'u', buf => {
  const decoder = new TextDecoder('utf8');
  return 'u' + decoder.decode(buf);
}, str => {
  const encoder = new TextEncoder();
  return encoder.encode(str.substring(1));
});
const ascii = createCodec('ascii', 'a', buf => {
  let string = 'a';
  for (let i = 0; i < buf.length; i++) {
    string += String.fromCharCode(buf[i]);
  }
  return string;
}, str => {
  str = str.substring(1);
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
});
const BASES = {
  utf8: string,
  'utf-8': string,
  hex: basics.bases.base16,
  latin1: ascii,
  ascii: ascii,
  binary: ascii,
  ...basics.bases
};

var bases = BASES;

var toString_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });



function toString(array, encoding = 'utf8') {
  const base = bases[encoding];
  if (!base) {
    throw new Error(`Unsupported encoding "${ encoding }"`);
  }
  return base.encoder.encode(array).substring(1);
}

exports.toString = toString;
});

var concat_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

function concat(arrays, length) {
  if (!length) {
    length = arrays.reduce((acc, curr) => acc + curr.length, 0);
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const arr of arrays) {
    output.set(arr, offset);
    offset += arr.length;
  }
  return output;
}

exports.concat = concat;
});

var __classPrivateFieldSet$1 = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet$1 = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __asyncValues = (undefined && undefined.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var _IPFS$1;
class Adapter {
    constructor(context) {
        _IPFS$1.set(this, void 0);
        __classPrivateFieldSet$1(this, _IPFS$1, context.IPFS);
        this.putAdapter = new IpfsPutAdapter(context);
    }
    async get(address) {
        var e_1, _a;
        const cid = address.toString();
        const chunks = [];
        try {
            // @ts-ignore
            for (var _b = __asyncValues(__classPrivateFieldGet$1(this, _IPFS$1).cat(cid)), _c; _c = await _b.next(), !_c.done;) {
                const chunk = _c.value;
                chunks.push(chunk);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const fileString = toString_1.toString(concat_1.concat(chunks));
        const fileJson = JSON.parse(fileString);
        //pin file to help persistence
        await __classPrivateFieldGet$1(this, _IPFS$1).pin.add(cid);
        return fileJson;
    }
}
_IPFS$1 = new WeakMap();

var Icon = "'use strict';\n\nfunction noop() { }\nfunction run(fn) {\n    return fn();\n}\nfunction blank_object() {\n    return Object.create(null);\n}\nfunction run_all(fns) {\n    fns.forEach(run);\n}\nfunction is_function(thing) {\n    return typeof thing === 'function';\n}\nfunction safe_not_equal(a, b) {\n    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');\n}\nfunction is_empty(obj) {\n    return Object.keys(obj).length === 0;\n}\n\nfunction append(target, node) {\n    target.appendChild(node);\n}\nfunction insert(target, node, anchor) {\n    target.insertBefore(node, anchor || null);\n}\nfunction detach(node) {\n    node.parentNode.removeChild(node);\n}\nfunction element(name) {\n    return document.createElement(name);\n}\nfunction svg_element(name) {\n    return document.createElementNS('http://www.w3.org/2000/svg', name);\n}\nfunction text(data) {\n    return document.createTextNode(data);\n}\nfunction space() {\n    return text(' ');\n}\nfunction attr(node, attribute, value) {\n    if (value == null)\n        node.removeAttribute(attribute);\n    else if (node.getAttribute(attribute) !== value)\n        node.setAttribute(attribute, value);\n}\nfunction children(element) {\n    return Array.from(element.childNodes);\n}\nfunction set_data(text, data) {\n    data = '' + data;\n    if (text.wholeText !== data)\n        text.data = data;\n}\n\nlet current_component;\nfunction set_current_component(component) {\n    current_component = component;\n}\n\nconst dirty_components = [];\nconst binding_callbacks = [];\nconst render_callbacks = [];\nconst flush_callbacks = [];\nconst resolved_promise = Promise.resolve();\nlet update_scheduled = false;\nfunction schedule_update() {\n    if (!update_scheduled) {\n        update_scheduled = true;\n        resolved_promise.then(flush);\n    }\n}\nfunction add_render_callback(fn) {\n    render_callbacks.push(fn);\n}\nlet flushing = false;\nconst seen_callbacks = new Set();\nfunction flush() {\n    if (flushing)\n        return;\n    flushing = true;\n    do {\n        // first, call beforeUpdate functions\n        // and update components\n        for (let i = 0; i < dirty_components.length; i += 1) {\n            const component = dirty_components[i];\n            set_current_component(component);\n            update(component.$$);\n        }\n        set_current_component(null);\n        dirty_components.length = 0;\n        while (binding_callbacks.length)\n            binding_callbacks.pop()();\n        // then, once components are updated, call\n        // afterUpdate functions. This may cause\n        // subsequent updates...\n        for (let i = 0; i < render_callbacks.length; i += 1) {\n            const callback = render_callbacks[i];\n            if (!seen_callbacks.has(callback)) {\n                // ...so guard against infinite loops\n                seen_callbacks.add(callback);\n                callback();\n            }\n        }\n        render_callbacks.length = 0;\n    } while (dirty_components.length);\n    while (flush_callbacks.length) {\n        flush_callbacks.pop()();\n    }\n    update_scheduled = false;\n    flushing = false;\n    seen_callbacks.clear();\n}\nfunction update($$) {\n    if ($$.fragment !== null) {\n        $$.update();\n        run_all($$.before_update);\n        const dirty = $$.dirty;\n        $$.dirty = [-1];\n        $$.fragment && $$.fragment.p($$.ctx, dirty);\n        $$.after_update.forEach(add_render_callback);\n    }\n}\nconst outroing = new Set();\nfunction transition_in(block, local) {\n    if (block && block.i) {\n        outroing.delete(block);\n        block.i(local);\n    }\n}\nfunction mount_component(component, target, anchor) {\n    const { fragment, on_mount, on_destroy, after_update } = component.$$;\n    fragment && fragment.m(target, anchor);\n    // onMount happens before the initial afterUpdate\n    add_render_callback(() => {\n        const new_on_destroy = on_mount.map(run).filter(is_function);\n        if (on_destroy) {\n            on_destroy.push(...new_on_destroy);\n        }\n        else {\n            // Edge case - component was destroyed immediately,\n            // most likely as a result of a binding initialising\n            run_all(new_on_destroy);\n        }\n        component.$$.on_mount = [];\n    });\n    after_update.forEach(add_render_callback);\n}\nfunction destroy_component(component, detaching) {\n    const $$ = component.$$;\n    if ($$.fragment !== null) {\n        run_all($$.on_destroy);\n        $$.fragment && $$.fragment.d(detaching);\n        // TODO null out other refs, including component.$$ (but need to\n        // preserve final state?)\n        $$.on_destroy = $$.fragment = null;\n        $$.ctx = [];\n    }\n}\nfunction make_dirty(component, i) {\n    if (component.$$.dirty[0] === -1) {\n        dirty_components.push(component);\n        schedule_update();\n        component.$$.dirty.fill(0);\n    }\n    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));\n}\nfunction init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {\n    const parent_component = current_component;\n    set_current_component(component);\n    const prop_values = options.props || {};\n    const $$ = component.$$ = {\n        fragment: null,\n        ctx: null,\n        // state\n        props,\n        update: noop,\n        not_equal,\n        bound: blank_object(),\n        // lifecycle\n        on_mount: [],\n        on_destroy: [],\n        before_update: [],\n        after_update: [],\n        context: new Map(parent_component ? parent_component.$$.context : []),\n        // everything else\n        callbacks: blank_object(),\n        dirty,\n        skip_bound: false\n    };\n    let ready = false;\n    $$.ctx = instance\n        ? instance(component, prop_values, (i, ret, ...rest) => {\n            const value = rest.length ? rest[0] : ret;\n            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {\n                if (!$$.skip_bound && $$.bound[i])\n                    $$.bound[i](value);\n                if (ready)\n                    make_dirty(component, i);\n            }\n            return ret;\n        })\n        : [];\n    $$.update();\n    ready = true;\n    run_all($$.before_update);\n    // `false` as a special case of no DOM component\n    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;\n    if (options.target) {\n        if (options.hydrate) {\n            const nodes = children(options.target);\n            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion\n            $$.fragment && $$.fragment.l(nodes);\n            nodes.forEach(detach);\n        }\n        else {\n            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion\n            $$.fragment && $$.fragment.c();\n        }\n        if (options.intro)\n            transition_in(component.$$.fragment);\n        mount_component(component, options.target, options.anchor);\n        flush();\n    }\n    set_current_component(parent_component);\n}\nlet SvelteElement;\nif (typeof HTMLElement === 'function') {\n    SvelteElement = class extends HTMLElement {\n        constructor() {\n            super();\n            this.attachShadow({ mode: 'open' });\n        }\n        connectedCallback() {\n            // @ts-ignore todo: improve typings\n            for (const key in this.$$.slotted) {\n                // @ts-ignore todo: improve typings\n                this.appendChild(this.$$.slotted[key]);\n            }\n        }\n        attributeChangedCallback(attr, _oldValue, newValue) {\n            this[attr] = newValue;\n        }\n        $destroy() {\n            destroy_component(this, 1);\n            this.$destroy = noop;\n        }\n        $on(type, callback) {\n            // TODO should this delegate to addEventListener?\n            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));\n            callbacks.push(callback);\n            return () => {\n                const index = callbacks.indexOf(callback);\n                if (index !== -1)\n                    callbacks.splice(index, 1);\n            };\n        }\n        $set($$props) {\n            if (this.$$set && !is_empty($$props)) {\n                this.$$.skip_bound = true;\n                this.$$set($$props);\n                this.$$.skip_bound = false;\n            }\n        }\n    };\n}\n\n/* Icon.svelte generated by Svelte v3.28.0 */\n\nfunction create_fragment(ctx) {\n\tlet div;\n\tlet h1;\n\tlet t0;\n\tlet t1;\n\tlet h2;\n\tlet t2;\n\tlet t3;\n\tlet svg;\n\tlet path0;\n\tlet path1;\n\tlet path2;\n\tlet path3;\n\tlet path4;\n\tlet path5;\n\tlet path6;\n\tlet path7;\n\n\treturn {\n\t\tc() {\n\t\t\tdiv = element(\"div\");\n\t\t\th1 = element(\"h1\");\n\t\t\tt0 = text(/*name*/ ctx[0]);\n\t\t\tt1 = space();\n\t\t\th2 = element(\"h2\");\n\t\t\tt2 = text(/*description*/ ctx[1]);\n\t\t\tt3 = space();\n\t\t\tsvg = svg_element(\"svg\");\n\t\t\tpath0 = svg_element(\"path\");\n\t\t\tpath1 = svg_element(\"path\");\n\t\t\tpath2 = svg_element(\"path\");\n\t\t\tpath3 = svg_element(\"path\");\n\t\t\tpath4 = svg_element(\"path\");\n\t\t\tpath5 = svg_element(\"path\");\n\t\t\tpath6 = svg_element(\"path\");\n\t\t\tpath7 = svg_element(\"path\");\n\t\t\tthis.c = noop;\n\t\t\tattr(h1, \"class\", \"name\");\n\t\t\tattr(h2, \"class\", \"description\");\n\t\t\tattr(path0, \"fill\", \"#fff\");\n\t\t\tattr(path0, \"d\", \"M10,37.5c-4.136,0-7.5-3.364-7.5-7.5V10c0-4.136,3.364-7.5,7.5-7.5h20c4.136,0,7.5,3.364,7.5,7.5v20 c0,4.136-3.364,7.5-7.5,7.5H10z\");\n\t\t\tattr(path1, \"fill\", \"#4788c7\");\n\t\t\tattr(path1, \"d\", \"M30,3c3.86,0,7,3.14,7,7v20c0,3.86-3.14,7-7,7H10c-3.86,0-7-3.14-7-7V10c0-3.86,3.14-7,7-7H30 M30,2H10c-4.418,0-8,3.582-8,8v20c0,4.418,3.582,8,8,8h20c4.418,0,8-3.582,8-8V10C38,5.582,34.418,2,30,2L30,2z\");\n\t\t\tattr(path2, \"fill\", \"#dff0fe\");\n\t\t\tattr(path2, \"d\", \"M29.817,8.608L9.76,10.02C8.205,10.129,7,11.404,7,12.941v3.13C7,17.689,8.33,19,9.971,19h20.057\\tC31.67,19,33,17.689,33,16.071v-4.542C33,9.829,31.537,8.486,29.817,8.608z\");\n\t\t\tattr(path3, \"fill\", \"#dff0fe\");\n\t\t\tattr(path3, \"d\", \"M25,22.373v1.042c0,0.778-0.805,1.4-1.775,1.372l-2.571-0.074C19.731,24.688,19,24.081,19,23.342\\tv-0.968C19,21.615,19.768,21,20.714,21h2.571C24.232,21,25,21.615,25,22.373z\");\n\t\t\tattr(path4, \"fill\", \"#4788c7\");\n\t\t\tattr(path4, \"d\", \"M20.834,27.004l2.571,0.156C24.304,27.214,25,27.862,25,28.642v1.23c0,0.879-0.876,1.566-1.885,1.478\\tl-2.571-0.223C19.667,31.051,19,30.412,19,29.648v-1.163C19,27.624,19.843,26.944,20.834,27.004z\");\n\t\t\tattr(path5, \"fill\", \"#b6dcfe\");\n\t\t\tattr(path5, \"d\", \"M14.143,21H9.857C8.279,21,7,22.242,7,23.773v3.037c0,1.425,1.112,2.618,2.573,2.76l4.286,0.416\\tC15.541,30.149,17,28.867,17,27.226v-3.453C17,22.242,15.721,21,14.143,21z\");\n\t\t\tattr(path6, \"fill\", \"#b6dcfe\");\n\t\t\tattr(path6, \"d\", \"M33,22.486v1.416c0,0.842-0.698,1.515-1.54,1.485l-2.971-0.108c-0.799-0.029-1.432-0.685-1.432-1.485\\tv-1.308c0-0.821,0.665-1.486,1.486-1.486h2.971C32.335,21,33,21.665,33,22.486z\");\n\t\t\tattr(path7, \"fill\", \"#98ccfd\");\n\t\t\tattr(path7, \"d\", \"M28.648,27.547l2.971,0.203c0.778,0.053,1.38,0.673,1.38,1.42v1.407c0,0.842-0.759,1.5-1.634,1.416\\tl-2.971-0.285c-0.76-0.073-1.338-0.685-1.338-1.416v-1.325C27.057,28.14,27.789,27.488,28.648,27.547z\");\n\t\t\tattr(svg, \"xmlns\", \"http://www.w3.org/2000/svg\");\n\t\t\tattr(svg, \"viewBox\", \"0 0 40 40\");\n\t\t\tattr(svg, \"width\", \"480px\");\n\t\t\tattr(svg, \"height\", \"480px\");\n\t\t\tattr(div, \"class\", \"container\");\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, div, anchor);\n\t\t\tappend(div, h1);\n\t\t\tappend(h1, t0);\n\t\t\tappend(div, t1);\n\t\t\tappend(div, h2);\n\t\t\tappend(h2, t2);\n\t\t\tappend(div, t3);\n\t\t\tappend(div, svg);\n\t\t\tappend(svg, path0);\n\t\t\tappend(svg, path1);\n\t\t\tappend(svg, path2);\n\t\t\tappend(svg, path3);\n\t\t\tappend(svg, path4);\n\t\t\tappend(svg, path5);\n\t\t\tappend(svg, path6);\n\t\t\tappend(svg, path7);\n\t\t},\n\t\tp(ctx, [dirty]) {\n\t\t\tif (dirty & /*name*/ 1) set_data(t0, /*name*/ ctx[0]);\n\t\t\tif (dirty & /*description*/ 2) set_data(t2, /*description*/ ctx[1]);\n\t\t},\n\t\ti: noop,\n\t\to: noop,\n\t\td(detaching) {\n\t\t\tif (detaching) detach(div);\n\t\t}\n\t};\n}\n\nfunction instance($$self, $$props, $$invalidate) {\n\t\n\tlet { expression } = $$props;\n\tlet name, description;\n\n\t$$self.$$set = $$props => {\n\t\tif (\"expression\" in $$props) $$invalidate(2, expression = $$props.expression);\n\t};\n\n\t$$self.$$.update = () => {\n\t\tif ($$self.$$.dirty & /*expression*/ 4) {\n\t\t\t if (expression && expression.data) {\n\t\t\t\tconst expr = JSON.parse(expression.data);\n\t\t\t\t$$invalidate(0, name = expr.name);\n\t\t\t\t$$invalidate(1, description = expr.description);\n\t\t\t}\n\t\t}\n\t};\n\n\treturn [name, description, expression];\n}\n\nclass Icon extends SvelteElement {\n\tconstructor(options) {\n\t\tsuper();\n\t\tthis.shadowRoot.innerHTML = `<style>.container{color:burlywood;width:480px;height:480px}.name{position:absolute;top:40px;left:40px}.description{position:absolute;top:80px;left:40px}</style>`;\n\t\tinit(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, { expression: 2 });\n\n\t\tif (options) {\n\t\t\tif (options.target) {\n\t\t\t\tinsert(options.target, this, options.anchor);\n\t\t\t}\n\n\t\t\tif (options.props) {\n\t\t\t\tthis.$set(options.props);\n\t\t\t\tflush();\n\t\t\t}\n\t\t}\n\t}\n\n\tstatic get observedAttributes() {\n\t\treturn [\"expression\"];\n\t}\n\n\tget expression() {\n\t\treturn this.$$.ctx[2];\n\t}\n\n\tset expression(expression) {\n\t\tthis.$set({ expression });\n\t\tflush();\n\t}\n}\n\nmodule.exports = Icon;\n//# sourceMappingURL=Icon.js.map\n";

var ConstructorIcon = "'use strict';\n\nfunction noop() { }\nfunction assign(tar, src) {\n    // @ts-ignore\n    for (const k in src)\n        tar[k] = src[k];\n    return tar;\n}\nfunction run(fn) {\n    return fn();\n}\nfunction blank_object() {\n    return Object.create(null);\n}\nfunction run_all(fns) {\n    fns.forEach(run);\n}\nfunction is_function(thing) {\n    return typeof thing === 'function';\n}\nfunction safe_not_equal(a, b) {\n    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');\n}\nfunction is_empty(obj) {\n    return Object.keys(obj).length === 0;\n}\nfunction exclude_internal_props(props) {\n    const result = {};\n    for (const k in props)\n        if (k[0] !== '$')\n            result[k] = props[k];\n    return result;\n}\nfunction compute_rest_props(props, keys) {\n    const rest = {};\n    keys = new Set(keys);\n    for (const k in props)\n        if (!keys.has(k) && k[0] !== '$')\n            rest[k] = props[k];\n    return rest;\n}\nfunction action_destroyer(action_result) {\n    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;\n}\n\nfunction append(target, node) {\n    target.appendChild(node);\n}\nfunction insert(target, node, anchor) {\n    target.insertBefore(node, anchor || null);\n}\nfunction detach(node) {\n    node.parentNode.removeChild(node);\n}\nfunction element(name) {\n    return document.createElement(name);\n}\nfunction text(data) {\n    return document.createTextNode(data);\n}\nfunction space() {\n    return text(' ');\n}\nfunction empty() {\n    return text('');\n}\nfunction listen(node, event, handler, options) {\n    node.addEventListener(event, handler, options);\n    return () => node.removeEventListener(event, handler, options);\n}\nfunction prevent_default(fn) {\n    return function (event) {\n        event.preventDefault();\n        // @ts-ignore\n        return fn.call(this, event);\n    };\n}\nfunction stop_propagation(fn) {\n    return function (event) {\n        event.stopPropagation();\n        // @ts-ignore\n        return fn.call(this, event);\n    };\n}\nfunction attr(node, attribute, value) {\n    if (value == null)\n        node.removeAttribute(attribute);\n    else if (node.getAttribute(attribute) !== value)\n        node.setAttribute(attribute, value);\n}\nfunction set_attributes(node, attributes) {\n    // @ts-ignore\n    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);\n    for (const key in attributes) {\n        if (attributes[key] == null) {\n            node.removeAttribute(key);\n        }\n        else if (key === 'style') {\n            node.style.cssText = attributes[key];\n        }\n        else if (key === '__value') {\n            node.value = node[key] = attributes[key];\n        }\n        else if (descriptors[key] && descriptors[key].set) {\n            node[key] = attributes[key];\n        }\n        else {\n            attr(node, key, attributes[key]);\n        }\n    }\n}\nfunction children(element) {\n    return Array.from(element.childNodes);\n}\nfunction set_data(text, data) {\n    data = '' + data;\n    if (text.wholeText !== data)\n        text.data = data;\n}\nfunction set_input_value(input, value) {\n    input.value = value == null ? '' : value;\n}\n\nlet current_component;\nfunction set_current_component(component) {\n    current_component = component;\n}\nfunction get_current_component() {\n    if (!current_component)\n        throw new Error(`Function called outside component initialization`);\n    return current_component;\n}\nfunction onDestroy(fn) {\n    get_current_component().$$.on_destroy.push(fn);\n}\nfunction setContext(key, context) {\n    get_current_component().$$.context.set(key, context);\n}\nfunction getContext(key) {\n    return get_current_component().$$.context.get(key);\n}\n// TODO figure out if we still want to support\n// shorthand events, or if we want to implement\n// a real bubbling mechanism\nfunction bubble(component, event) {\n    const callbacks = component.$$.callbacks[event.type];\n    if (callbacks) {\n        callbacks.slice().forEach(fn => fn(event));\n    }\n}\n\nconst dirty_components = [];\nconst binding_callbacks = [];\nconst render_callbacks = [];\nconst flush_callbacks = [];\nconst resolved_promise = Promise.resolve();\nlet update_scheduled = false;\nfunction schedule_update() {\n    if (!update_scheduled) {\n        update_scheduled = true;\n        resolved_promise.then(flush);\n    }\n}\nfunction add_render_callback(fn) {\n    render_callbacks.push(fn);\n}\nlet flushing = false;\nconst seen_callbacks = new Set();\nfunction flush() {\n    if (flushing)\n        return;\n    flushing = true;\n    do {\n        // first, call beforeUpdate functions\n        // and update components\n        for (let i = 0; i < dirty_components.length; i += 1) {\n            const component = dirty_components[i];\n            set_current_component(component);\n            update(component.$$);\n        }\n        set_current_component(null);\n        dirty_components.length = 0;\n        while (binding_callbacks.length)\n            binding_callbacks.pop()();\n        // then, once components are updated, call\n        // afterUpdate functions. This may cause\n        // subsequent updates...\n        for (let i = 0; i < render_callbacks.length; i += 1) {\n            const callback = render_callbacks[i];\n            if (!seen_callbacks.has(callback)) {\n                // ...so guard against infinite loops\n                seen_callbacks.add(callback);\n                callback();\n            }\n        }\n        render_callbacks.length = 0;\n    } while (dirty_components.length);\n    while (flush_callbacks.length) {\n        flush_callbacks.pop()();\n    }\n    update_scheduled = false;\n    flushing = false;\n    seen_callbacks.clear();\n}\nfunction update($$) {\n    if ($$.fragment !== null) {\n        $$.update();\n        run_all($$.before_update);\n        const dirty = $$.dirty;\n        $$.dirty = [-1];\n        $$.fragment && $$.fragment.p($$.ctx, dirty);\n        $$.after_update.forEach(add_render_callback);\n    }\n}\nconst outroing = new Set();\nlet outros;\nfunction group_outros() {\n    outros = {\n        r: 0,\n        c: [],\n        p: outros // parent group\n    };\n}\nfunction check_outros() {\n    if (!outros.r) {\n        run_all(outros.c);\n    }\n    outros = outros.p;\n}\nfunction transition_in(block, local) {\n    if (block && block.i) {\n        outroing.delete(block);\n        block.i(local);\n    }\n}\nfunction transition_out(block, local, detach, callback) {\n    if (block && block.o) {\n        if (outroing.has(block))\n            return;\n        outroing.add(block);\n        outros.c.push(() => {\n            outroing.delete(block);\n            if (callback) {\n                if (detach)\n                    block.d(1);\n                callback();\n            }\n        });\n        block.o(local);\n    }\n}\n\nfunction get_spread_update(levels, updates) {\n    const update = {};\n    const to_null_out = {};\n    const accounted_for = { $$scope: 1 };\n    let i = levels.length;\n    while (i--) {\n        const o = levels[i];\n        const n = updates[i];\n        if (n) {\n            for (const key in o) {\n                if (!(key in n))\n                    to_null_out[key] = 1;\n            }\n            for (const key in n) {\n                if (!accounted_for[key]) {\n                    update[key] = n[key];\n                    accounted_for[key] = 1;\n                }\n            }\n            levels[i] = n;\n        }\n        else {\n            for (const key in o) {\n                accounted_for[key] = 1;\n            }\n        }\n    }\n    for (const key in to_null_out) {\n        if (!(key in update))\n            update[key] = undefined;\n    }\n    return update;\n}\nfunction get_spread_object(spread_props) {\n    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};\n}\nfunction create_component(block) {\n    block && block.c();\n}\nfunction mount_component(component, target, anchor) {\n    const { fragment, on_mount, on_destroy, after_update } = component.$$;\n    fragment && fragment.m(target, anchor);\n    // onMount happens before the initial afterUpdate\n    add_render_callback(() => {\n        const new_on_destroy = on_mount.map(run).filter(is_function);\n        if (on_destroy) {\n            on_destroy.push(...new_on_destroy);\n        }\n        else {\n            // Edge case - component was destroyed immediately,\n            // most likely as a result of a binding initialising\n            run_all(new_on_destroy);\n        }\n        component.$$.on_mount = [];\n    });\n    after_update.forEach(add_render_callback);\n}\nfunction destroy_component(component, detaching) {\n    const $$ = component.$$;\n    if ($$.fragment !== null) {\n        run_all($$.on_destroy);\n        $$.fragment && $$.fragment.d(detaching);\n        // TODO null out other refs, including component.$$ (but need to\n        // preserve final state?)\n        $$.on_destroy = $$.fragment = null;\n        $$.ctx = [];\n    }\n}\nfunction make_dirty(component, i) {\n    if (component.$$.dirty[0] === -1) {\n        dirty_components.push(component);\n        schedule_update();\n        component.$$.dirty.fill(0);\n    }\n    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));\n}\nfunction init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {\n    const parent_component = current_component;\n    set_current_component(component);\n    const prop_values = options.props || {};\n    const $$ = component.$$ = {\n        fragment: null,\n        ctx: null,\n        // state\n        props,\n        update: noop,\n        not_equal,\n        bound: blank_object(),\n        // lifecycle\n        on_mount: [],\n        on_destroy: [],\n        before_update: [],\n        after_update: [],\n        context: new Map(parent_component ? parent_component.$$.context : []),\n        // everything else\n        callbacks: blank_object(),\n        dirty,\n        skip_bound: false\n    };\n    let ready = false;\n    $$.ctx = instance\n        ? instance(component, prop_values, (i, ret, ...rest) => {\n            const value = rest.length ? rest[0] : ret;\n            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {\n                if (!$$.skip_bound && $$.bound[i])\n                    $$.bound[i](value);\n                if (ready)\n                    make_dirty(component, i);\n            }\n            return ret;\n        })\n        : [];\n    $$.update();\n    ready = true;\n    run_all($$.before_update);\n    // `false` as a special case of no DOM component\n    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;\n    if (options.target) {\n        if (options.hydrate) {\n            const nodes = children(options.target);\n            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion\n            $$.fragment && $$.fragment.l(nodes);\n            nodes.forEach(detach);\n        }\n        else {\n            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion\n            $$.fragment && $$.fragment.c();\n        }\n        if (options.intro)\n            transition_in(component.$$.fragment);\n        mount_component(component, options.target, options.anchor);\n        flush();\n    }\n    set_current_component(parent_component);\n}\nlet SvelteElement;\nif (typeof HTMLElement === 'function') {\n    SvelteElement = class extends HTMLElement {\n        constructor() {\n            super();\n            this.attachShadow({ mode: 'open' });\n        }\n        connectedCallback() {\n            // @ts-ignore todo: improve typings\n            for (const key in this.$$.slotted) {\n                // @ts-ignore todo: improve typings\n                this.appendChild(this.$$.slotted[key]);\n            }\n        }\n        attributeChangedCallback(attr, _oldValue, newValue) {\n            this[attr] = newValue;\n        }\n        $destroy() {\n            destroy_component(this, 1);\n            this.$destroy = noop;\n        }\n        $on(type, callback) {\n            // TODO should this delegate to addEventListener?\n            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));\n            callbacks.push(callback);\n            return () => {\n                const index = callbacks.indexOf(callback);\n                if (index !== -1)\n                    callbacks.splice(index, 1);\n            };\n        }\n        $set($$props) {\n            if (this.$$set && !is_empty($$props)) {\n                this.$$.skip_bound = true;\n                this.$$set($$props);\n                this.$$.skip_bound = false;\n            }\n        }\n    };\n}\n\nfunction classMap(classObj) {\n    return Object.entries(classObj)\n        .filter(([name, value]) => name !== '' && value)\n        .map(([name]) => name)\n        .join(' ');\n}\n\n// Match old modifiers. (only works on DOM events)\nconst oldModifierRegex = /^[a-z]+(?::(?:preventDefault|stopPropagation|passive|nonpassive|capture|once|self))+$/;\n// Match new modifiers.\nconst newModifierRegex = /^[^$]+(?:\\$(?:preventDefault|stopPropagation|passive|nonpassive|capture|once|self))+$/;\nfunction forwardEventsBuilder(component) {\n    // This is our pseudo $on function. It is defined on component mount.\n    let $on;\n    // This is a list of events bound before mount.\n    let events = [];\n    // And we override the $on function to forward all bound events.\n    component.$on = (fullEventType, callback) => {\n        let eventType = fullEventType;\n        let destructor = () => { };\n        if ($on) {\n            // The event was bound programmatically.\n            destructor = $on(eventType, callback);\n        }\n        else {\n            // The event was bound before mount by Svelte.\n            events.push([eventType, callback]);\n        }\n        const oldModifierMatch = eventType.match(oldModifierRegex);\n        if (oldModifierMatch && console) {\n            console.warn('Event modifiers in SMUI now use \"$\" instead of \":\", so that ' +\n                'all events can be bound with modifiers. Please update your ' +\n                'event binding: ', eventType);\n        }\n        return () => {\n            destructor();\n        };\n    };\n    function forward(e) {\n        // Internally bubble the event up from Svelte components.\n        bubble(component, e);\n    }\n    return (node) => {\n        const destructors = [];\n        const forwardDestructors = {};\n        // This function is responsible for listening and forwarding\n        // all bound events.\n        $on = (fullEventType, callback) => {\n            let eventType = fullEventType;\n            let handler = callback;\n            // DOM addEventListener options argument.\n            let options = false;\n            const oldModifierMatch = eventType.match(oldModifierRegex);\n            const newModifierMatch = eventType.match(newModifierRegex);\n            const modifierMatch = oldModifierMatch || newModifierMatch;\n            if (eventType.match(/^SMUI:\\w+:/)) {\n                const newEventTypeParts = eventType.split(':');\n                let newEventType = '';\n                for (let i = 0; i < newEventTypeParts.length; i++) {\n                    newEventType +=\n                        i === newEventTypeParts.length - 1\n                            ? ':' + newEventTypeParts[i]\n                            : newEventTypeParts[i]\n                                .split('-')\n                                .map((value) => value.slice(0, 1).toUpperCase() + value.slice(1))\n                                .join('');\n                }\n                console.warn(`The event ${eventType.split('$')[0]} has been renamed to ${newEventType.split('$')[0]}.`);\n                eventType = newEventType;\n            }\n            if (modifierMatch) {\n                // Parse the event modifiers.\n                // Supported modifiers:\n                // - preventDefault\n                // - stopPropagation\n                // - passive\n                // - nonpassive\n                // - capture\n                // - once\n                const parts = eventType.split(oldModifierMatch ? ':' : '$');\n                eventType = parts[0];\n                const eventOptions = Object.fromEntries(parts.slice(1).map((mod) => [mod, true]));\n                if (eventOptions.passive) {\n                    options = options || {};\n                    options.passive = true;\n                }\n                if (eventOptions.nonpassive) {\n                    options = options || {};\n                    options.passive = false;\n                }\n                if (eventOptions.capture) {\n                    options = options || {};\n                    options.capture = true;\n                }\n                if (eventOptions.once) {\n                    options = options || {};\n                    options.once = true;\n                }\n                if (eventOptions.preventDefault) {\n                    handler = prevent_default(handler);\n                }\n                if (eventOptions.stopPropagation) {\n                    handler = stop_propagation(handler);\n                }\n            }\n            // Listen for the event directly, with the given options.\n            const off = listen(node, eventType, handler, options);\n            const destructor = () => {\n                off();\n                const idx = destructors.indexOf(destructor);\n                if (idx > -1) {\n                    destructors.splice(idx, 1);\n                }\n            };\n            destructors.push(destructor);\n            // Forward the event from Svelte.\n            if (!(eventType in forwardDestructors)) {\n                forwardDestructors[eventType] = listen(node, eventType, forward);\n            }\n            return destructor;\n        };\n        for (let i = 0; i < events.length; i++) {\n            // Listen to all the events added before mount.\n            $on(events[i][0], events[i][1]);\n        }\n        return {\n            destroy: () => {\n                // Remove all event listeners.\n                for (let i = 0; i < destructors.length; i++) {\n                    destructors[i]();\n                }\n                // Remove all event forwarders.\n                for (let entry of Object.entries(forwardDestructors)) {\n                    entry[1]();\n                }\n            },\n        };\n    };\n}\n\nfunction useActions(node, actions) {\n    let actionReturns = [];\n    if (actions) {\n        for (let i = 0; i < actions.length; i++) {\n            const actionEntry = actions[i];\n            const action = Array.isArray(actionEntry) ? actionEntry[0] : actionEntry;\n            if (Array.isArray(actionEntry) && actionEntry.length > 1) {\n                actionReturns.push(action(node, actionEntry[1]));\n            }\n            else {\n                actionReturns.push(action(node));\n            }\n        }\n    }\n    return {\n        update(actions) {\n            if (((actions && actions.length) || 0) != actionReturns.length) {\n                throw new Error('You must not change the length of an actions array.');\n            }\n            if (actions) {\n                for (let i = 0; i < actions.length; i++) {\n                    const returnEntry = actionReturns[i];\n                    if (returnEntry && returnEntry.update) {\n                        const actionEntry = actions[i];\n                        if (Array.isArray(actionEntry) && actionEntry.length > 1) {\n                            returnEntry.update(actionEntry[1]);\n                        }\n                        else {\n                            returnEntry.update();\n                        }\n                    }\n                }\n            }\n        },\n        destroy() {\n            for (let i = 0; i < actionReturns.length; i++) {\n                const returnEntry = actionReturns[i];\n                if (returnEntry && returnEntry.destroy) {\n                    returnEntry.destroy();\n                }\n            }\n        },\n    };\n}\n\n/* node_modules/@smui/common/dist/elements/Div.svelte generated by Svelte v3.28.0 */\n\nfunction create_fragment(ctx) {\n\tlet div;\n\tlet slot;\n\tlet useActions_action;\n\tlet forwardEvents_action;\n\tlet mounted;\n\tlet dispose;\n\tlet div_levels = [/*$$restProps*/ ctx[3]];\n\tlet div_data = {};\n\n\tfor (let i = 0; i < div_levels.length; i += 1) {\n\t\tdiv_data = assign(div_data, div_levels[i]);\n\t}\n\n\treturn {\n\t\tc() {\n\t\t\tdiv = element(\"div\");\n\t\t\tslot = element(\"slot\");\n\t\t\tthis.c = noop;\n\t\t\tset_attributes(div, div_data);\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, div, anchor);\n\t\t\tappend(div, slot);\n\t\t\t/*div_binding*/ ctx[5](div);\n\n\t\t\tif (!mounted) {\n\t\t\t\tdispose = [\n\t\t\t\t\taction_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[0])),\n\t\t\t\t\taction_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[2].call(null, div))\n\t\t\t\t];\n\n\t\t\t\tmounted = true;\n\t\t\t}\n\t\t},\n\t\tp(ctx, [dirty]) {\n\t\t\tset_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3]]));\n\t\t\tif (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);\n\t\t},\n\t\ti: noop,\n\t\to: noop,\n\t\td(detaching) {\n\t\t\tif (detaching) detach(div);\n\t\t\t/*div_binding*/ ctx[5](null);\n\t\t\tmounted = false;\n\t\t\trun_all(dispose);\n\t\t}\n\t};\n}\n\nfunction instance($$self, $$props, $$invalidate) {\n\tconst omit_props_names = [\"use\",\"getElement\"];\n\tlet $$restProps = compute_rest_props($$props, omit_props_names);\n\tlet { use = [] } = $$props;\n\tconst forwardEvents = forwardEventsBuilder(get_current_component());\n\tlet element;\n\n\tfunction getElement() {\n\t\treturn element;\n\t}\n\n\tfunction div_binding($$value) {\n\t\tbinding_callbacks[$$value ? \"unshift\" : \"push\"](() => {\n\t\t\telement = $$value;\n\t\t\t$$invalidate(1, element);\n\t\t});\n\t}\n\n\t$$self.$$set = $$new_props => {\n\t\t$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));\n\t\t$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));\n\t\tif (\"use\" in $$new_props) $$invalidate(0, use = $$new_props.use);\n\t};\n\n\treturn [use, element, forwardEvents, $$restProps, getElement, div_binding];\n}\n\nclass Div extends SvelteElement {\n\tconstructor(options) {\n\t\tsuper();\n\t\tinit(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, { use: 0, getElement: 4 });\n\n\t\tif (options) {\n\t\t\tif (options.target) {\n\t\t\t\tinsert(options.target, this, options.anchor);\n\t\t\t}\n\n\t\t\tif (options.props) {\n\t\t\t\tthis.$set(options.props);\n\t\t\t\tflush();\n\t\t\t}\n\t\t}\n\t}\n\n\tstatic get observedAttributes() {\n\t\treturn [\"use\", \"getElement\"];\n\t}\n\n\tget use() {\n\t\treturn this.$$.ctx[0];\n\t}\n\n\tset use(use) {\n\t\tthis.$set({ use });\n\t\tflush();\n\t}\n\n\tget getElement() {\n\t\treturn this.$$.ctx[4];\n\t}\n}\n\n/* node_modules/@smui/common/dist/elements/Span.svelte generated by Svelte v3.28.0 */\n\nfunction create_fragment$1(ctx) {\n\tlet span;\n\tlet slot;\n\tlet useActions_action;\n\tlet forwardEvents_action;\n\tlet mounted;\n\tlet dispose;\n\tlet span_levels = [/*$$restProps*/ ctx[3]];\n\tlet span_data = {};\n\n\tfor (let i = 0; i < span_levels.length; i += 1) {\n\t\tspan_data = assign(span_data, span_levels[i]);\n\t}\n\n\treturn {\n\t\tc() {\n\t\t\tspan = element(\"span\");\n\t\t\tslot = element(\"slot\");\n\t\t\tthis.c = noop;\n\t\t\tset_attributes(span, span_data);\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, span, anchor);\n\t\t\tappend(span, slot);\n\t\t\t/*span_binding*/ ctx[5](span);\n\n\t\t\tif (!mounted) {\n\t\t\t\tdispose = [\n\t\t\t\t\taction_destroyer(useActions_action = useActions.call(null, span, /*use*/ ctx[0])),\n\t\t\t\t\taction_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[2].call(null, span))\n\t\t\t\t];\n\n\t\t\t\tmounted = true;\n\t\t\t}\n\t\t},\n\t\tp(ctx, [dirty]) {\n\t\t\tset_attributes(span, span_data = get_spread_update(span_levels, [dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3]]));\n\t\t\tif (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);\n\t\t},\n\t\ti: noop,\n\t\to: noop,\n\t\td(detaching) {\n\t\t\tif (detaching) detach(span);\n\t\t\t/*span_binding*/ ctx[5](null);\n\t\t\tmounted = false;\n\t\t\trun_all(dispose);\n\t\t}\n\t};\n}\n\nfunction instance$1($$self, $$props, $$invalidate) {\n\tconst omit_props_names = [\"use\",\"getElement\"];\n\tlet $$restProps = compute_rest_props($$props, omit_props_names);\n\tlet { use = [] } = $$props;\n\tconst forwardEvents = forwardEventsBuilder(get_current_component());\n\tlet element;\n\n\tfunction getElement() {\n\t\treturn element;\n\t}\n\n\tfunction span_binding($$value) {\n\t\tbinding_callbacks[$$value ? \"unshift\" : \"push\"](() => {\n\t\t\telement = $$value;\n\t\t\t$$invalidate(1, element);\n\t\t});\n\t}\n\n\t$$self.$$set = $$new_props => {\n\t\t$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));\n\t\t$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));\n\t\tif (\"use\" in $$new_props) $$invalidate(0, use = $$new_props.use);\n\t};\n\n\treturn [use, element, forwardEvents, $$restProps, getElement, span_binding];\n}\n\nclass Span extends SvelteElement {\n\tconstructor(options) {\n\t\tsuper();\n\t\tinit(this, { target: this.shadowRoot }, instance$1, create_fragment$1, safe_not_equal, { use: 0, getElement: 4 });\n\n\t\tif (options) {\n\t\t\tif (options.target) {\n\t\t\t\tinsert(options.target, this, options.anchor);\n\t\t\t}\n\n\t\t\tif (options.props) {\n\t\t\t\tthis.$set(options.props);\n\t\t\t\tflush();\n\t\t\t}\n\t\t}\n\t}\n\n\tstatic get observedAttributes() {\n\t\treturn [\"use\", \"getElement\"];\n\t}\n\n\tget use() {\n\t\treturn this.$$.ctx[0];\n\t}\n\n\tset use(use) {\n\t\tthis.$set({ use });\n\t\tflush();\n\t}\n\n\tget getElement() {\n\t\treturn this.$$.ctx[4];\n\t}\n}\n\nconst Div$1 = Div;\nconst Span$1 = Span;\n\n/* node_modules/@smui/common/dist/classadder/ClassAdder.svelte generated by Svelte v3.28.0 */\n\nfunction create_default_slot(ctx) {\n\tlet slot;\n\n\treturn {\n\t\tc() {\n\t\t\tslot = element(\"slot\");\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, slot, anchor);\n\t\t},\n\t\td(detaching) {\n\t\t\tif (detaching) detach(slot);\n\t\t}\n\t};\n}\n\nfunction create_fragment$2(ctx) {\n\tlet switch_instance;\n\tlet switch_instance_anchor;\n\tlet current;\n\n\tconst switch_instance_spread_levels = [\n\t\t{\n\t\t\tuse: [/*forwardEvents*/ ctx[7], .../*use*/ ctx[0]]\n\t\t},\n\t\t{\n\t\t\tclass: classMap({\n\t\t\t\t[/*className*/ ctx[1]]: true,\n\t\t\t\t[/*smuiClass*/ ctx[5]]: true,\n\t\t\t\t.../*smuiClassMap*/ ctx[4]\n\t\t\t})\n\t\t},\n\t\t/*props*/ ctx[6],\n\t\t/*$$restProps*/ ctx[8]\n\t];\n\n\tvar switch_value = /*component*/ ctx[2];\n\n\tfunction switch_props(ctx) {\n\t\tlet switch_instance_props = {\n\t\t\t$$slots: { default: [create_default_slot] },\n\t\t\t$$scope: { ctx }\n\t\t};\n\n\t\tfor (let i = 0; i < switch_instance_spread_levels.length; i += 1) {\n\t\t\tswitch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);\n\t\t}\n\n\t\treturn { props: switch_instance_props };\n\t}\n\n\tif (switch_value) {\n\t\tswitch_instance = new switch_value(switch_props(ctx));\n\t\t/*switch_instance_binding*/ ctx[10](switch_instance);\n\t}\n\n\treturn {\n\t\tc() {\n\t\t\tif (switch_instance) create_component(switch_instance.$$.fragment);\n\t\t\tswitch_instance_anchor = empty();\n\t\t\tthis.c = noop;\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tif (switch_instance) {\n\t\t\t\tmount_component(switch_instance, target, anchor);\n\t\t\t}\n\n\t\t\tinsert(target, switch_instance_anchor, anchor);\n\t\t\tcurrent = true;\n\t\t},\n\t\tp(ctx, [dirty]) {\n\t\t\tconst switch_instance_changes = (dirty & /*forwardEvents, use, classMap, className, smuiClass, smuiClassMap, props, $$restProps*/ 499)\n\t\t\t? get_spread_update(switch_instance_spread_levels, [\n\t\t\t\t\tdirty & /*forwardEvents, use*/ 129 && {\n\t\t\t\t\t\tuse: [/*forwardEvents*/ ctx[7], .../*use*/ ctx[0]]\n\t\t\t\t\t},\n\t\t\t\t\tdirty & /*classMap, className, smuiClass, smuiClassMap*/ 50 && {\n\t\t\t\t\t\tclass: classMap({\n\t\t\t\t\t\t\t[/*className*/ ctx[1]]: true,\n\t\t\t\t\t\t\t[/*smuiClass*/ ctx[5]]: true,\n\t\t\t\t\t\t\t.../*smuiClassMap*/ ctx[4]\n\t\t\t\t\t\t})\n\t\t\t\t\t},\n\t\t\t\t\tdirty & /*props*/ 64 && get_spread_object(/*props*/ ctx[6]),\n\t\t\t\t\tdirty & /*$$restProps*/ 256 && get_spread_object(/*$$restProps*/ ctx[8])\n\t\t\t\t])\n\t\t\t: {};\n\n\t\t\tif (dirty & /*$$scope*/ 8192) {\n\t\t\t\tswitch_instance_changes.$$scope = { dirty, ctx };\n\t\t\t}\n\n\t\t\tif (switch_value !== (switch_value = /*component*/ ctx[2])) {\n\t\t\t\tif (switch_instance) {\n\t\t\t\t\tgroup_outros();\n\t\t\t\t\tconst old_component = switch_instance;\n\n\t\t\t\t\ttransition_out(old_component.$$.fragment, 1, 0, () => {\n\t\t\t\t\t\tdestroy_component(old_component, 1);\n\t\t\t\t\t});\n\n\t\t\t\t\tcheck_outros();\n\t\t\t\t}\n\n\t\t\t\tif (switch_value) {\n\t\t\t\t\tswitch_instance = new switch_value(switch_props(ctx));\n\t\t\t\t\t/*switch_instance_binding*/ ctx[10](switch_instance);\n\t\t\t\t\tcreate_component(switch_instance.$$.fragment);\n\t\t\t\t\ttransition_in(switch_instance.$$.fragment, 1);\n\t\t\t\t\tmount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);\n\t\t\t\t} else {\n\t\t\t\t\tswitch_instance = null;\n\t\t\t\t}\n\t\t\t} else if (switch_value) {\n\t\t\t\tswitch_instance.$set(switch_instance_changes);\n\t\t\t}\n\t\t},\n\t\ti(local) {\n\t\t\tif (current) return;\n\t\t\tif (switch_instance) transition_in(switch_instance.$$.fragment, local);\n\t\t\tcurrent = true;\n\t\t},\n\t\to(local) {\n\t\t\tif (switch_instance) transition_out(switch_instance.$$.fragment, local);\n\t\t\tcurrent = false;\n\t\t},\n\t\td(detaching) {\n\t\t\t/*switch_instance_binding*/ ctx[10](null);\n\t\t\tif (detaching) detach(switch_instance_anchor);\n\t\t\tif (switch_instance) destroy_component(switch_instance, detaching);\n\t\t}\n\t};\n}\n\nconst internals = {\n\tcomponent: Div,\n\tclass: \"\",\n\tclassMap: {},\n\tcontexts: {},\n\tprops: {}\n};\n\nfunction instance$2($$self, $$props, $$invalidate) {\n\tconst omit_props_names = [\"use\",\"class\",\"component\",\"getElement\"];\n\tlet $$restProps = compute_rest_props($$props, omit_props_names);\n\tlet { use = [] } = $$props;\n\tlet { class: className = \"\" } = $$props;\n\tlet element;\n\tconst smuiClass = internals.class;\n\tconst smuiClassMap = {};\n\tconst smuiClassUnsubscribes = [];\n\tconst contexts = internals.contexts;\n\tconst props = internals.props;\n\tlet { component = internals.component } = $$props;\n\n\tObject.entries(internals.classMap).forEach(([name, context]) => {\n\t\tconst store = getContext(context);\n\n\t\tif (store && \"subscribe\" in store) {\n\t\t\tsmuiClassUnsubscribes.push(store.subscribe(value => {\n\t\t\t\t$$invalidate(4, smuiClassMap[name] = value, smuiClassMap);\n\t\t\t}));\n\t\t}\n\t});\n\n\tconst forwardEvents = forwardEventsBuilder(get_current_component());\n\n\tfor (let context in contexts) {\n\t\tif (contexts.hasOwnProperty(context)) {\n\t\t\tsetContext(context, contexts[context]);\n\t\t}\n\t}\n\n\tonDestroy(() => {\n\t\tfor (const unsubscribe of smuiClassUnsubscribes) {\n\t\t\tunsubscribe();\n\t\t}\n\t});\n\n\tfunction getElement() {\n\t\treturn element.getElement();\n\t}\n\n\tfunction switch_instance_binding($$value) {\n\t\tbinding_callbacks[$$value ? \"unshift\" : \"push\"](() => {\n\t\t\telement = $$value;\n\t\t\t$$invalidate(3, element);\n\t\t});\n\t}\n\n\t$$self.$$set = $$new_props => {\n\t\t$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));\n\t\t$$invalidate(8, $$restProps = compute_rest_props($$props, omit_props_names));\n\t\tif (\"use\" in $$new_props) $$invalidate(0, use = $$new_props.use);\n\t\tif (\"class\" in $$new_props) $$invalidate(1, className = $$new_props.class);\n\t\tif (\"component\" in $$new_props) $$invalidate(2, component = $$new_props.component);\n\t};\n\n\treturn [\n\t\tuse,\n\t\tclassName,\n\t\tcomponent,\n\t\telement,\n\t\tsmuiClassMap,\n\t\tsmuiClass,\n\t\tprops,\n\t\tforwardEvents,\n\t\t$$restProps,\n\t\tgetElement,\n\t\tswitch_instance_binding\n\t];\n}\n\nclass ClassAdder extends SvelteElement {\n\tconstructor(options) {\n\t\tsuper();\n\n\t\tinit(this, { target: this.shadowRoot }, instance$2, create_fragment$2, safe_not_equal, {\n\t\t\tuse: 0,\n\t\t\tclass: 1,\n\t\t\tcomponent: 2,\n\t\t\tgetElement: 9\n\t\t});\n\n\t\tif (options) {\n\t\t\tif (options.target) {\n\t\t\t\tinsert(options.target, this, options.anchor);\n\t\t\t}\n\n\t\t\tif (options.props) {\n\t\t\t\tthis.$set(options.props);\n\t\t\t\tflush();\n\t\t\t}\n\t\t}\n\t}\n\n\tstatic get observedAttributes() {\n\t\treturn [\"use\", \"class\", \"component\", \"getElement\"];\n\t}\n\n\tget use() {\n\t\treturn this.$$.ctx[0];\n\t}\n\n\tset use(use) {\n\t\tthis.$set({ use });\n\t\tflush();\n\t}\n\n\tget class() {\n\t\treturn this.$$.ctx[1];\n\t}\n\n\tset class(className) {\n\t\tthis.$set({ class: className });\n\t\tflush();\n\t}\n\n\tget component() {\n\t\treturn this.$$.ctx[2];\n\t}\n\n\tset component(component) {\n\t\tthis.$set({ component });\n\t\tflush();\n\t}\n\n\tget getElement() {\n\t\treturn this.$$.ctx[9];\n\t}\n}\n\n// @ts-ignore: Internals is exported... argh.\nconst defaults = Object.assign({}, internals);\nfunction classAdderBuilder(props) {\n    return new Proxy(ClassAdder, {\n        construct: function (target, args) {\n            Object.assign(internals, defaults, props);\n            // @ts-ignore: Need spread arg.\n            return new target(...args);\n        },\n        get: function (target, prop) {\n            Object.assign(internals, defaults, props);\n            return target[prop];\n        },\n    });\n}\n\nclassAdderBuilder({\n    class: 'mdc-text-field-helper-line',\n    component: Div$1,\n});\n\nclassAdderBuilder({\n    class: 'mdc-text-field__affix mdc-text-field__affix--prefix',\n    component: Span$1,\n});\n\nclassAdderBuilder({\n    class: 'mdc-text-field__affix mdc-text-field__affix--suffix',\n    component: Span$1,\n});\n\n/* ConstructorIcon.svelte generated by Svelte v3.28.0 */\n\nfunction create_else_block(ctx) {\n\tlet button;\n\tlet mounted;\n\tlet dispose;\n\n\treturn {\n\t\tc() {\n\t\t\tbutton = element(\"button\");\n\t\t\tbutton.textContent = \"Commit\";\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, button, anchor);\n\n\t\t\tif (!mounted) {\n\t\t\t\tdispose = listen(button, \"click\", /*commit*/ ctx[6]);\n\t\t\t\tmounted = true;\n\t\t\t}\n\t\t},\n\t\tp: noop,\n\t\td(detaching) {\n\t\t\tif (detaching) detach(button);\n\t\t\tmounted = false;\n\t\t\tdispose();\n\t\t}\n\t};\n}\n\n// (42:4) {#if name.length == 0 || description.length == 0}\nfunction create_if_block(ctx) {\n\tlet button;\n\n\treturn {\n\t\tc() {\n\t\t\tbutton = element(\"button\");\n\t\t\tbutton.textContent = \"Commit\";\n\t\t\tbutton.disabled = true;\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, button, anchor);\n\t\t},\n\t\tp: noop,\n\t\td(detaching) {\n\t\t\tif (detaching) detach(button);\n\t\t}\n\t};\n}\n\nfunction create_fragment$3(ctx) {\n\tlet div1;\n\tlet p0;\n\tlet span0;\n\tlet t1;\n\tlet input0;\n\tlet t2;\n\tlet p1;\n\tlet span1;\n\tlet t4;\n\tlet input1;\n\tlet t5;\n\tlet input2;\n\tlet t6;\n\tlet t7;\n\tlet button;\n\tlet t9;\n\tlet div0;\n\tlet t10;\n\tlet mounted;\n\tlet dispose;\n\n\tfunction select_block_type(ctx, dirty) {\n\t\tif (/*name*/ ctx[2].length == 0 || /*description*/ ctx[3].length == 0) return create_if_block;\n\t\treturn create_else_block;\n\t}\n\n\tlet current_block_type = select_block_type(ctx);\n\tlet if_block = current_block_type(ctx);\n\n\treturn {\n\t\tc() {\n\t\t\tdiv1 = element(\"div\");\n\t\t\tp0 = element(\"p\");\n\t\t\tspan0 = element(\"span\");\n\t\t\tspan0.textContent = \"Name:\";\n\t\t\tt1 = space();\n\t\t\tinput0 = element(\"input\");\n\t\t\tt2 = space();\n\t\t\tp1 = element(\"p\");\n\t\t\tspan1 = element(\"span\");\n\t\t\tspan1.textContent = \"Description:\";\n\t\t\tt4 = space();\n\t\t\tinput1 = element(\"input\");\n\t\t\tt5 = space();\n\t\t\tinput2 = element(\"input\");\n\t\t\tt6 = space();\n\t\t\tif_block.c();\n\t\t\tt7 = space();\n\t\t\tbutton = element(\"button\");\n\t\t\tbutton.textContent = \"Discard\";\n\t\t\tt9 = space();\n\t\t\tdiv0 = element(\"div\");\n\t\t\tt10 = text(/*bundle*/ ctx[4]);\n\t\t\tthis.c = noop;\n\t\t\tattr(input2, \"type\", \"file\");\n\t\t\tattr(input2, \"accept\", \".js\");\n\t\t\tattr(div0, \"class\", \"text\");\n\t\t\tattr(div1, \"class\", \"container\");\n\t\t},\n\t\tm(target, anchor) {\n\t\t\tinsert(target, div1, anchor);\n\t\t\tappend(div1, p0);\n\t\t\tappend(p0, span0);\n\t\t\tappend(p0, t1);\n\t\t\tappend(p0, input0);\n\t\t\tset_input_value(input0, /*name*/ ctx[2]);\n\t\t\tappend(div1, t2);\n\t\t\tappend(div1, p1);\n\t\t\tappend(p1, span1);\n\t\t\tappend(p1, t4);\n\t\t\tappend(p1, input1);\n\t\t\tset_input_value(input1, /*description*/ ctx[3]);\n\t\t\tappend(div1, t5);\n\t\t\tappend(div1, input2);\n\t\t\t/*input2_binding*/ ctx[11](input2);\n\t\t\tappend(div1, t6);\n\t\t\tif_block.m(div1, null);\n\t\t\tappend(div1, t7);\n\t\t\tappend(div1, button);\n\t\t\tappend(div1, t9);\n\t\t\tappend(div1, div0);\n\t\t\tappend(div0, t10);\n\n\t\t\tif (!mounted) {\n\t\t\t\tdispose = [\n\t\t\t\t\tlisten(input0, \"input\", /*input0_input_handler*/ ctx[8]),\n\t\t\t\t\tlisten(input1, \"input\", /*input1_input_handler*/ ctx[9]),\n\t\t\t\t\tlisten(input2, \"change\", /*change_handler*/ ctx[10]),\n\t\t\t\t\tlisten(button, \"click\", function () {\n\t\t\t\t\t\tif (is_function(/*discard*/ ctx[0])) /*discard*/ ctx[0].apply(this, arguments);\n\t\t\t\t\t})\n\t\t\t\t];\n\n\t\t\t\tmounted = true;\n\t\t\t}\n\t\t},\n\t\tp(new_ctx, [dirty]) {\n\t\t\tctx = new_ctx;\n\n\t\t\tif (dirty & /*name*/ 4 && input0.value !== /*name*/ ctx[2]) {\n\t\t\t\tset_input_value(input0, /*name*/ ctx[2]);\n\t\t\t}\n\n\t\t\tif (dirty & /*description*/ 8 && input1.value !== /*description*/ ctx[3]) {\n\t\t\t\tset_input_value(input1, /*description*/ ctx[3]);\n\t\t\t}\n\n\t\t\tif (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {\n\t\t\t\tif_block.p(ctx, dirty);\n\t\t\t} else {\n\t\t\t\tif_block.d(1);\n\t\t\t\tif_block = current_block_type(ctx);\n\n\t\t\t\tif (if_block) {\n\t\t\t\t\tif_block.c();\n\t\t\t\t\tif_block.m(div1, t7);\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tif (dirty & /*bundle*/ 16) set_data(t10, /*bundle*/ ctx[4]);\n\t\t},\n\t\ti: noop,\n\t\to: noop,\n\t\td(detaching) {\n\t\t\tif (detaching) detach(div1);\n\t\t\t/*input2_binding*/ ctx[11](null);\n\t\t\tif_block.d();\n\t\t\tmounted = false;\n\t\t\trun_all(dispose);\n\t\t}\n\t};\n}\n\nfunction instance$3($$self, $$props, $$invalidate) {\n\tlet { commitExpression } = $$props;\n\tlet { discard } = $$props;\n\tlet fileinput;\n\tlet name = \"\";\n\tlet description = \"\";\n\tlet bundle = \"\";\n\n\tfunction onFileSelected(e) {\n\t\tlet bundleFile = e.target.files[0];\n\t\tlet reader = new FileReader();\n\t\treader.readAsText(bundleFile);\n\n\t\treader.onload = e => {\n\t\t\t$$invalidate(4, bundle = e.target.result.toString());\n\t\t};\n\t}\n\n\tfunction commit() {\n\t\tcommitExpression({ name, description, bundle });\n\t}\n\n\tfunction input0_input_handler() {\n\t\tname = this.value;\n\t\t$$invalidate(2, name);\n\t}\n\n\tfunction input1_input_handler() {\n\t\tdescription = this.value;\n\t\t$$invalidate(3, description);\n\t}\n\n\tconst change_handler = e => onFileSelected(e);\n\n\tfunction input2_binding($$value) {\n\t\tbinding_callbacks[$$value ? \"unshift\" : \"push\"](() => {\n\t\t\tfileinput = $$value;\n\t\t\t$$invalidate(1, fileinput);\n\t\t});\n\t}\n\n\t$$self.$$set = $$props => {\n\t\tif (\"commitExpression\" in $$props) $$invalidate(7, commitExpression = $$props.commitExpression);\n\t\tif (\"discard\" in $$props) $$invalidate(0, discard = $$props.discard);\n\t};\n\n\treturn [\n\t\tdiscard,\n\t\tfileinput,\n\t\tname,\n\t\tdescription,\n\t\tbundle,\n\t\tonFileSelected,\n\t\tcommit,\n\t\tcommitExpression,\n\t\tinput0_input_handler,\n\t\tinput1_input_handler,\n\t\tchange_handler,\n\t\tinput2_binding\n\t];\n}\n\nclass ConstructorIcon extends SvelteElement {\n\tconstructor(options) {\n\t\tsuper();\n\t\tthis.shadowRoot.innerHTML = `<style>.container{color:burlywood;width:400px;height:300px}input{width:100%;height:200px}</style>`;\n\t\tinit(this, { target: this.shadowRoot }, instance$3, create_fragment$3, safe_not_equal, { commitExpression: 7, discard: 0 });\n\n\t\tif (options) {\n\t\t\tif (options.target) {\n\t\t\t\tinsert(options.target, this, options.anchor);\n\t\t\t}\n\n\t\t\tif (options.props) {\n\t\t\t\tthis.$set(options.props);\n\t\t\t\tflush();\n\t\t\t}\n\t\t}\n\t}\n\n\tstatic get observedAttributes() {\n\t\treturn [\"commitExpression\", \"discard\"];\n\t}\n\n\tget commitExpression() {\n\t\treturn this.$$.ctx[7];\n\t}\n\n\tset commitExpression(commitExpression) {\n\t\tthis.$set({ commitExpression });\n\t\tflush();\n\t}\n\n\tget discard() {\n\t\treturn this.$$.ctx[0];\n\t}\n\n\tset discard(discard) {\n\t\tthis.$set({ discard });\n\t\tflush();\n\t}\n}\n\nmodule.exports = ConstructorIcon;\n//# sourceMappingURL=ConstructorIcon.js.map\n";

class VirtualIconExpressionUI {
    icon() {
        return Icon;
    }
    constructorIcon() {
        return ConstructorIcon;
    }
}

function interactions(expression) {
    return [];
}
const name = 'virtual-icons';
function create(context) {
    const expressionAdapter = new Adapter(context);
    const expressionUI = new VirtualIconExpressionUI();
    return {
        name,
        expressionAdapter,
        expressionUI,
        interactions,
    };
}

exports.default = create;
exports.name = name;
//# sourceMappingURL=bundle.js.map
