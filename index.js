
////////////////////////////////////////////////////
////////  	   Migration SERVER     		    ///////
/////// convert mongo collection to csv     ///////
//////////////////////////////////////////////////
require('dotenv').config()
const {MongoClient} = require("mongodb")
const weaviate = require('weaviate-client');

const fs = require("fs");

let url = process.env.DB
let WEAVIATE_HOST = process.env.WEAVIATE_PRODUCT_HOST
let OPEN_API_KEY = process.env.OPENAI_API_KEY

const client = new MongoClient(url)

const w_client = weaviate.client({
  scheme: 'https',
  host: WEAVIATE_HOST,
  headers: {"X-OpenAI-Api-Key": OPEN_API_KEY},
});

let classObj = {
  class: "Product",
  vectorizer: "text2vec-openai"
}

async function main() {
  
  await client.connect();
  console.log('Connected successfully to Database server');
  const db = client.db();
  const product = db.collection('product');
  const cursor = product.find({});
  let x=0
  let batcher = w_client.batch.objectsBatcher()
  let counter = 0
  let batchsize = 50
  await cursor.forEach(doc => {
      x++
      if (x < 5) console.log(doc._id)

      // construct an object with class and properties
      const obj = {
        class: 'Product',
        properties: {
          id: doc._id,
          url: doc.url,
          crawled_at: doc.crawled_at,
          source: doc.source,
          name: doc.name,
          images: doc.images,
          description: doc.description,
          brand: doc.brand,
          sku_id: doc.sku_id,
          price: doc.price,
          in_stock: doc.in_stock,
          currency: doc.currency,
          color: doc.color,
          breadcrumbs: doc.breadcrumbs,
          avg_rating: doc.avg_rating,
          total_reviews: doc.total_reviews,
          overview: doc.overview,
          specifications: doc.specifications,
          p_id: doc.id
        }
      }

      //add the object to the batch queue
      batcher = batcher.withObject(obj)

      // when the batch counter reaches batchsize, push to Weaviate
      if (counter++ == batchsize) {
        // flush the batch queue
        batcher
        .do()
        .then(res => {
          console.log(res)
        })
        .catch(err => {
          console.log(err)
        })
        // restart the batch queue
        counter = 0
        batcher = w_client.batch.objectsBatcher()
      }

        
    });
    // flush the remaining objects
    batcher
    .do()
    .then(res => {
      console.log("----finally ----")
      console.log(res)
    })
    .catch(err => {
      console.error(err)
    });
    console.log('---- returning done-----')
    return 'done'
  }
 

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());

 