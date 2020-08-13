let random = require('./random');
let gid = require('./GID').GID;

class User {
    constructor(name, setting = {}) {
        this.username = name;
        this.money = setting.money || 1500;
        this.isBanned = setting.isBanned || false;
        this.isGuest = setting.isGuest || false;
        this.isPremium = setting.isPremium || false;
        this.bannedTime = 0;
        this.premiumTime = 0;
        this.GID = gid.GetGID(name);
    }
}

module.exports.User = User;