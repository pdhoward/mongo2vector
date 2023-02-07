
////////////////////////////////////////////////////
////////  	   Migration SERVER     		    ///////
/////// convert mongo collection to csv     ///////
//////////////////////////////////////////////////
require('dotenv').config()
const {MongoClient} = require("mongodb")
const weaviate = require('weaviate-client');

const fs = require("fs");

let url = process.env.DB
let WEAVIATE_URL = process.env.WEAVIATE_URL
let OPEN_API_KEY = process.env.OPENAI_API_KEY

const client = new MongoClient(url)

const w_client = weaviate.client({
  scheme: 'https',
  host: WEAVIATE_URL,
  headers: {"X-OpenAI-Api-Key": OPEN_API_KEY},
});


var toImport = [{
  class: 'Author',
  id: '36ddd591-2dee-4e7e-a3cc-eb86d30a4303',
  properties: {
    name: 'Jane Doe',
    writesFor: [{
      beacon: 'weaviate://localhost/f81bfe5e-16ba-4615-a516-46c2ae2e5a80'
    }]
  }
},
{
  class: 'Author',
  id: '36ddd591-2dee-4e7e-a3cc-eb86d30a4304',
  properties: {
    name: 'John Doe',
    writesFor: [{
      beacon: 'weaviate://localhost/f81bfe5e-16ba-4615-a516-46c2ae2e5a80'
    }]
  }
}];


async function main() {
  
  await client.connect();
  console.log('Connected successfully to Database server');
  const db = client.db();
  const product = db.collection('product');
  const cursor = product.find({});
  await cursor.forEach(doc => {
      csv.stringify([doc], {header: false}, (err, output) => {
        fs.appendFileSync("product.csv", output);
        
      });
    })
  return 'done'
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());

 