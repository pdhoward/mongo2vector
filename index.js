
////////////////////////////////////////////////////
////////  	   Migration SERVER     		    ///////
/////// convert mongo collection to csv     ///////
//////////////////////////////////////////////////
require('dotenv').config()
const {MongoClient} = require("mongodb")
const {ObjectId} = require('mongodb')
const weaviate = require('weaviate-client');

const fs = require("fs");

let url = process.env.DB
let WEAVIATE_HOST = process.env.WEAVIATE_PRODUCT_HOST
let OPEN_API_KEY = process.env.OPENAI_API_KEY

const client = new MongoClient(url)

const cleanString = (str) => {
  if ((str === null) || (str === "")) return false
  str = str.toString()
  let regex = /<a.*?<\/a>/ig
  return str.replaceAll(regex, "")
}

const convertArray = (str) => {
  if ((str === null) || (str === "")) return []
  return str.split('~')
}

const w_client = weaviate.client({
  scheme: 'https',
  host: WEAVIATE_HOST,
  headers: {"X-OpenAI-Api-Key": OPEN_API_KEY},
});

let className = "Product"

let classObj = {  
    "class": "Product",
    "description": "A product catalog",
    "vectorize": "text2vec-openai",
    "properties": [
      { "dataType": ["string"],
        "description": "Id of the product object from Mongo DB",
        "name": "objectId"
      },
      { "dataType": ["string"],
        "description": "url for the product",
        "name": "url"
      },
      { "dataType": ["string"],
        "description": "date the information was retrieved from website",
        "name": "crawledAt"
      },
      { "dataType": ["string"],
        "description": "website where product is hosted",
        "name": "source"
      },
      { "dataType": ["text"],
        "description": "Product long name",
        "name": "name"
      },
      { "dataType": ["string[]"],
        "description": "string of endpoints for product images",
        "name": "images"
      },
      { "dataType": ["text"],
        "description": "description of the product",
        "name": "description"
      },
      { "dataType": ["string"],
        "description": "Brand name of the product",
        "name": "brand"
      },
      { "dataType": ["string"],
        "description": "SKU id for the product",
        "name": "skuId"
      },
      { "dataType": ["text"],
        "description": "Retail price for the product",
        "name": "price"
      },
      { "dataType": ["text"],
        "description": "Indicator of current product availability",
        "name": "in_stock"
      },
      { "dataType": ["text"],
        "description": "Currency of the listed price",
        "name": "currency"
      },
      { "dataType": ["text"],
        "description": "The color of the product if relevant",
        "name": "color"
      },
      { "dataType": ["text"],
        "description": "URL path segment",
        "name": "breadcrumbs"
      },
      { "dataType": ["text"],
        "description": "Average of the total product reviews",
        "name": "averageRating"
      },
      { "dataType": ["text"],
        "description": "A detailed review of the product and associated considerations",
        "name": "overview"
      },
      { "dataType": ["text"],
        "description": "The set of specifications for the product, such as warranties, size, tolerances etc",
        "name": "specifications"
      },
      { "dataType": ["text"],
        "description": "Unique id of the product",
        "name": "productId"
      },
    ]
   
}

let testClassName = "Products"


let testClassObj = {  
  "classes": [
    {
      "class": "Products",
      "description": "A product catalog",
      "vectorize": "text2vec-openai",
      "properties": [
        { "dataType": ["text"],
          "description": "Product long name",
          "name": "name"
        }
      ]
    }
  ]  
}

///////////////////////////////////////
///// delete existing classes ////////
/////////////////////////////////////


w_client.schema
  .classDeleter()
  .withClassName(testClassName)
  .do()
  .then(
    w_client
      .schema
      .getter()
      .do()
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log(`------error in schema delete-----`)
        console.error(err)
      })
  )
  .catch(err => {
    console.error(err)
  })


/////////////////////////////////////
//////    add a class /////////////
//////////////////////////////////
// add the schema
w_client
  .schema
  .classCreator()
  .withClass(testClassObj)
  .do()
  .then(res => {
    console.log(res)
  })
  .catch(err => {
    console.log(`-----error in class add-------`)
    console.error(err)
  });
 
  
  // get and print the schema
 w_client
    .schema
    .getter()
    .do()
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.error(err)
    });


async function main() {
  
  await client.connect();
  console.log('Connected successfully to Database server');
  const db = client.db();
  const product = db.collection('product');
  const cursor = product.find({}).limit(10)
  let x=0
  let batcher = w_client.batch.objectsBatcher()
  let counter = 0
  let batchsize = 50
  await cursor.forEach(doc => {
      x++
      
      let scrubOverview = cleanString(doc.overview)
      let scrubImages = convertArray(doc.images)
      let newId = new ObjectId(doc._id)
      let newIdString = newId.toString()
      let name = doc.name

      if (x < 5) {
        console.log(`The datatype for ${name} is ${typeof name}`)
      }

      // construct an object with class and properties
      /*
      const obj = {
        class: classObj,
        properties: {
          object_id: doc._id,
          url: doc.url,
          crawled_at: doc.crawled_at,
          source: doc.source,
          name: doc.name,
          images: scrubImages,
          description: doc.description,
          brand: doc.brand,
          sku_id: doc.sku_id,
          price: doc.price,
          in_stock: doc.in_stock,
          currency: doc.currency,
          color: doc.color,
          breadcrumbs: doc.breadcrumbs,
          average_rating: doc.avg_rating,
          total_reviews: doc.total_reviews,
          overview: scrubOverview,
          specifications: doc.specifications,
          product_id: doc.id
        }
      }
      */
      const obj = {
        class: testClassObj,
        properties: {
          name: name
          
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
          //console.log(`------Logging RES Object-----`)
          if (res.result){
            console.log(JSON.stringify(res.result.errors))
          }

          //console.log(res)
        })
        .catch(err => {
          console.log(`------catch error triggered ----`)
          console.log(err)
        })
        // restart the batch queue
        counter = 0
        batcher = w_client.batch.objectsBatcher()
      }

        
    });
    // flush the remaining objects
    let i = 0
    batcher
    .do()
    .then(res => {
      console.log("----finally ----")

      i++
      if (i < 2 ) {
        console.log(`===================DEBUG==============`)
        console.log(typeof res)
        //console.log(JSON.stringify(res))
        //console.log(res.result.errors.error)
        Object.keys(res).forEach((prop)=> console.log(prop));
        console.log(JSON.stringify(res[0].result))
      }
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

 