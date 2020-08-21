let mongoClient = require('mongodb').MongoClient;

class DB_Mongo {
    constructor(setting = {}, options) {
        this.url = setting.url;
        this.db_name = setting.db_name;
        this.collection_name = setting.collection_name;
        this.options = options
    }

    SycnFindOne(args = {}) {
        async function f() {
            let db = new mongoClient(this.url, this.options);
            let promise = () => {
                return new Promise((resolve, reject) => {
                    db.connect(async(err, client) => {
                        if (err) throw new Error(err.message);

                        const _db = client.db(this.db_name);
                        const _collection = _db.collection(this.collection_name);

                        let promise2 = () => {
                            return new Promise((resolve, reject) => {
                                _collection.find(args).limit(1).toArray((err, data) => {
                                    err 
                                    ? reject(err) 
                                    : resolve(data[0]);
                                });
                            });
                        }

                        let result = await promise2();
                        result ? resolve(result): reject({body: {type: "error", code: "001", message: "User not found"}});
                    });
                });
            }

            let result = await promise().catch((err) => {
                console.error(err);
                return null;
            });

            return result;
        };
        console.log(f());
    }
}


module.exports.DB_Mongo = DB_Mongo;