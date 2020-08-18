Array.copy = function(array) {
    let _ = [];
    for (let i of array)
        _.push(i);
    return _;
}

Array.rotate = function(array, pos, side = true, isClockwise = true) {
    if (pos > array.length) throw new Error("Длинна сдвига не может превышать длинну массива.");
    
    let _ = Array.copy(array);
    
    if (side) {
        if (isClockwise) {
            for (let i = 0; i < array.length; i++)
                array[(i + pos) % array.length] = _[i];
        } else {
            for (let i = 0; i < array.length; i++)
                array[(array.length - i + pos) % array.length] = _[i];
        }
    } else {
        if (isClockwise) {
            for (let i = 0; i < array.length; i++)
                array[(array.length - pos + i) % array.length] = _[i];
        } else {
            for (let i = 0; i < array.length; i++) {
                array[(array.length - pos - i + array.length) % array.length] = _[i];
            }
        }
    }

    return array;
}

/*
class GID {
    constructor() {}

    static #_g = this.gen();

    static *gen() {
        yield 'init';
        yield 0x11;
        yield 0x22;
        yield 0x33;
        yield 0x44;
        yield 0x55;
        yield 0x66;
        yield 0x77;
        yield 0x88;
        yield 0x99;
        yield 0xaa;
    }

    static GetHex(isNew = false) {
        if (isNew) this.#_g = this.gen();
        let _ = this.#_g.next();
        if (_.done) {
            this.#_g = this.gen();
            this.#_g.next();
            _ = this.#_g.next();
        }

        return _.value;
    }

    static GetBytes(str) {
        let bytes1 = [];
        let bytes2 = [];
        this.GetHex(true);

        for (let i = 0; i < str.length; i+=2)
            bytes1.push(str[i].charCodeAt());

        for (let i = 1; i < str.length; i+=2)
            bytes2.push(str[i].charCodeAt());
        
        if (bytes1.length < 4) {
            for (let i = 0; bytes1.length != 4; i++)
                bytes1.push(bytes2[bytes2.length - i - 1] ^ this.GetHex());
        }
        
        if (bytes2.length < 4) {
            for (let i = 0; bytes2.length != 4; i++)
                bytes2.push(bytes1[i] ^ this.GetHex());
        }
        
        if (bytes1.length !== bytes2.length) bytes2.push(bytes1[0] ^ bytes2[bytes2.length - 1]);

        return {bytes1, bytes2};
    }

    static Mixer(str) {
        let {bytes1, bytes2} = this.GetBytes(str);
        let bytes = [];
        
        for (let i = 0; bytes1.length !== 16; i++) {
            bytes1.push(bytes2[bytes2.length - i - 1] ^ bytes1[i] ^ this.GetHex());
        }
        
        for (let i = 0; bytes2.length !== 16; i++) {
            bytes2.push(bytes1[bytes1.length - i - 1] ^ bytes2[i] ^ this.GetHex());
        }
        
        bytes.push(bytes1[0] ^ bytes2[3] ^ this.GetHex());
        bytes.push(bytes1[3] ^ bytes2[12] ^ this.GetHex());
        bytes.push(bytes1[2] ^ bytes2[7] ^ this.GetHex());
        bytes.push(bytes1[7] ^ bytes2[5] ^ this.GetHex());
        
        bytes.push(bytes1[9] ^ bytes2[14] ^ this.GetHex());
        bytes.push(bytes1[10] ^ bytes2[1] ^ this.GetHex());
        bytes.push(bytes1[8] ^ bytes2[15] ^ this.GetHex());
        bytes.push(bytes1[4] ^ bytes2[6] ^ this.GetHex());
        
        bytes[0] ^= (bytes1[6] ^ bytes2[0]);
        bytes[1] ^= (bytes1[1] ^ bytes2[13]);
        bytes[2] ^= (bytes1[15] ^ bytes2[9]);
        bytes[3] ^= (bytes1[5] ^ bytes2[11]);
        
        bytes[4] ^= (bytes1[14] ^ bytes2[2]);
        bytes[5] ^= (bytes1[13] ^ bytes2[10]);
        bytes[6] ^= (bytes1[12] ^ bytes2[4]);
        bytes[7] ^= (bytes1[11] ^ bytes2[8]);
        
        return bytes;
    }

    static GetGID(str) {
        let alphabet = "ABCDEFGHIJKabcdefghijk0123456789";

        let result = "";
        let bytes = this.Mixer(str);
        
        for (let i = 0; i < 8; i++) {
            result += alphabet[bytes[i] >> 3];
            result += alphabet[bytes[i] & 0x1F];
        }

        return result;
    }
}

*/

const random = require('./random').Random;

class GID {
    constructor() {}

    static #_g = this.gen();

    static *gen() {
        yield 'init';
        yield 0x11;
        yield 0x22;
        yield 0x33;
        yield 0x44;
        yield 0x55;
        yield 0x66;
        yield 0x77;
        yield 0x88;
        yield 0x99;
        yield 0xaa;
    }

    static GetHex(isNew = false) {
        if (isNew) this.#_g = this.gen();
        let _ = this.#_g.next();
        if (_.done) {
            this.#_g = this.gen();
            this.#_g.next();
            _ = this.#_g.next();
        }

        return _.value;
    }

    static GetBytes(str) {
        let bytes1 = [];
        let bytes2 = [];
        this.GetHex(true);

        for (let i = 0; i < str.length; i+=2)
            bytes1.push(str[i].charCodeAt());

        for (let i = 1; i < str.length; i+=2)
            bytes2.push(str[i].charCodeAt());
        
        if (bytes1.length < 4) {
            for (let i = 0; bytes1.length != 4; i++)
                bytes1.push(bytes2[bytes2.length - i - 1] ^ this.GetHex());
        }
        
        if (bytes2.length < 4) {
            for (let i = 0; bytes2.length != 4; i++)
                bytes2.push(bytes1[i] ^ this.GetHex());
        }
        
        if (bytes1.length !== bytes2.length) bytes2.push(bytes1[0] ^ bytes2[bytes2.length - 1]);

        return {bytes1, bytes2};
    }

    static Mixer(str) {
        var {bytes1, bytes2} = this.GetBytes(str);
        let bytes = [];
        
        for (let i = 0; bytes1.length !== 16; i++) {
            bytes1.push(bytes2[bytes2.length - i - 1] ^ bytes1[i] ^ this.GetHex());
        }
        
        for (let i = 0; bytes2.length !== 16; i++) {
            bytes2.push(bytes1[bytes1.length - i - 1] ^ bytes2[i] ^ this.GetHex());
        }
        
        var {bytes1, bytes2} = this.MixArray({bytes1, bytes2});
        
        bytes.push(bytes1[0] ^ bytes2[3] ^ this.GetHex());
        bytes.push(bytes1[3] ^ bytes2[12] ^ this.GetHex());
        bytes.push(bytes1[2] ^ bytes2[7] ^ this.GetHex());
        bytes.push(bytes1[7] ^ bytes2[5] ^ this.GetHex());
        
        bytes.push(bytes1[9] ^ bytes2[14] ^ this.GetHex());
        bytes.push(bytes1[10] ^ bytes2[1] ^ this.GetHex());
        bytes.push(bytes1[8] ^ bytes2[15] ^ this.GetHex());
        bytes.push(bytes1[4] ^ bytes2[6] ^ this.GetHex());
        
        bytes[0] ^= (((bytes1[6] ^ bytes2[0]) << 1) & 0xFF);
        bytes[1] ^= (((bytes1[1] ^ bytes2[13]) << 2) & 0xFF);
        bytes[2] ^= (((bytes1[15] ^ bytes2[9]) << 1) & 0xFF);
        bytes[3] ^= (((bytes1[5] ^ bytes2[11]) << 2) & 0xFF);
        
        bytes[4] ^= (((bytes1[14] ^ bytes2[2]) << 1) & 0xFF);
        bytes[5] ^= (((bytes1[13] ^ bytes2[10]) << 2) & 0xFF);
        bytes[6] ^= (((bytes1[12] ^ bytes2[4]) << 1) & 0xFF);
        bytes[7] ^= (((bytes1[11] ^ bytes2[8]) << 2) & 0xFF);
        
        return bytes;
    }

    static MixArray(obj) {
        let {bytes1, bytes2} = obj;
        
        bytes1 = bytes1.concat(this.Mix1(bytes1.splice(0, 8)));
        bytes1 = bytes1.concat(this.Mix4(bytes2.splice(0, 8)));
        bytes2 = bytes2.concat(this.Mix2(bytes1.splice(0, 8)));
        bytes2 = bytes2.concat(this.Mix3(bytes2.splice(0, 8)));
        
        bytes1 = bytes1.concat(this.Mix4(bytes2.splice(0, 8)));
        bytes2 = bytes2.concat(this.Mix1(bytes1.splice(0, 8)));
        bytes1 = bytes1.concat(this.Mix2(bytes1.splice(0, 8)));
        bytes2 = bytes2.concat(this.Mix3(bytes2.splice(0, 8)));
        
        return {bytes1, bytes2};
    }

    static Mix1(bytes) {
        let _ = [];
        new random(bytes[0] ^ bytes[7] << 8 ^ this.GetHex()).NextBytes(_, 8);
        
        let pos = (bytes[0] ^ bytes[7] ^ bytes[4] ^ bytes[6]) % 5;
        let side = ((bytes[1] ^ bytes[3]) % 2) ? true: false;
        let isClockwise = ((bytes[2] ^ bytes[5]) % 2) ? true: false;
        
        bytes = Array.rotate(bytes, pos, side, isClockwise);
        
        for (let i = 0; i < 8; i++) {
            bytes[i] = (bytes[i] ^ _[7 - i] << 1);
            bytes[i] &= 0xFF;
        }
        
        return bytes;
    }

    static Mix2(bytes) {
        let _ = [];
        
        new random(bytes[0] ^ bytes[7] << 4 ^ this.GetHex()).NextBytes(_, 8);
        
        let pos = (bytes[0] ^ bytes[2] ^ bytes[4] ^ bytes[3]) % 5;
        let side = ((bytes[1] ^ bytes[6]) % 2) ? true: false;
        let isClockwise = ((bytes[7] ^ bytes[5]) % 2) ? true: false;
        
        bytes = Array.rotate(bytes, pos, side, isClockwise);
        
        for (let i = 0; i < 8; i++) {
            bytes[i] = (bytes[i] ^ _[7 - i] ^ this.GetHex());
        }
        
        return bytes;
    }

    static Mix3(bytes) {
        let _ = [];
        
        new random(bytes[0] << 16 ^ bytes[7] << 8 ^ this.GetHex()).NextBytes(_, 8);
        
        let pos = (bytes[3] ^ bytes[5] ^ bytes[4] ^ bytes[6]) % 5;
        let side = ((bytes[2] ^ bytes[0]) % 2) ? true: false;
        let isClockwise = ((bytes[1] ^ bytes[7]) % 2) ? true: false;
        
        bytes = Array.rotate(bytes, pos, side, isClockwise);
        
        for (let i = 0; i < 8; i++) {
            bytes[i] = (bytes[i] ^ _[i]);
            bytes[i] ^= _[7 - i] << 1;
            bytes[i] &= 0xFF
        }
        
        return bytes;
    }

    static Mix4(bytes) {
        let _ = [];
        
        new random(bytes[0] ^ bytes[7] ^ this.GetHex()).NextBytes(_, 8);
        
        let pos = (bytes[0] ^ bytes[7] ^ bytes[5] ^ bytes[1]) % 5;
        let side = ((bytes[6] ^ bytes[3]) % 2) ? true: false;
        let isClockwise = ((bytes[2] ^ bytes[4]) % 2) ? true: false;
        
        bytes = Array.rotate(bytes, pos, side, isClockwise);
        
        for (let i = 0; i < 8; i++) {
            bytes[i] = (bytes[7 - i] ^ _[i] << 2);
            bytes[i] &= 0xFF;
        }
        
        return bytes;
    }

    static GetGID(str) {
        let alphabet = "ABCDEFGHIJKabcdefghijk0123456789";

        let result = "";
        let bytes = this.Mixer(str);
        
        for (let i = 0; i < 8; i++) {
            result += alphabet[bytes[i] >> 3];
            result += alphabet[bytes[i] & 0x1F];
        }
        
        return result;
    }
}

module.exports.GID = GID;