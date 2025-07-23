require('dotenv').config();
const { MongoClient } = require('mongodb');

const db = process.env.MONGO_URL;
const client = new MongoClient(db);

async function connectDb() {
    try{
        await client.connect();
        console.log('database connected');
    } catch (err){
        console.error("database connection faiiled", err);
    }
};

module.exports = connectDb;