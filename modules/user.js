class User {
    constructor(name, pass, setting = {}) {
        this.username = name;
        this.money = setting.money || 1500;
        this.isBanned = setting.isBanned || false;
        this.isGuest = setting.isGuest || false;
    }
}





module.exports.User = User;