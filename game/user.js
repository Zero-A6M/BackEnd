let random = require('./random');

class User {
    constructor(name, setting = {}) {
        this.username = name;
        this.money = setting.money || 1500;
        this.isBanned = setting.isBanned || false;
        this.isGuest = setting.isGuest || false;
        this.bannedTime = 0;
        this.GID = User.GenerateGID(this.username);
    }

    static GetNum(name) {
        let bytes = [];
        let num1 = -1;
        let num2 = -1;

        for (let i = 0; i < 4; i++) {
            let _ = name[i].charCodeAt() & 255;
            bytes.push(_)
        }

        bytes.push(bytes[0] ^ bytes[2]);
        bytes.push(bytes[1] ^ bytes[3]);
        bytes.push(name[name.length - 2].charCodeAt() & 255 ^ bytes[bytes.length - 1]);
        bytes.push(name[name.length - 1].charCodeAt() & 255 ^ bytes[bytes.length - 1]);

        num1 = bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3];
        num2 = bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7];

        return num1 ^ num2;
    }

    static GenerateGID(name) {
        let alphabet = "ABCDEFGHIJKabcdefghijk0123456789";

        let result = "";
        let _r = new random.Random(this.GetNum(name))
        let bytes = [];

        _r.NextBytes(bytes, 6);

        for (let i =0; i < 6; i++) {
            result += alphabet[bytes[i] >> 3];
            result += alphabet[bytes[i] & 0x1F];
        }

        return result;
    }
}





module.exports.User = User;