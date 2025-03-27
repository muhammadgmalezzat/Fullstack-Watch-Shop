const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;

let _db;
const mongoConnect = (callback) => {
    mongoClient.connect("mongodb+srv://watch-shop-admin:HYHw14Qoj0kZFnA8@watch-shop-cluster.wzllo78.mongodb.net/")
    .then(
        client => {
            console.log("connection");
            _db = client.db();
            callback();
        }
    )
    .catch(
        err => {
            console.log(`err: ${err}`);
            throw err;
});

    
}

const getDb = () => {
        if (_db) { 
            return _db;
        }
        throw "No MongoDB found"
    }

module.exports = {
    mongoConnect,
    getDb
};