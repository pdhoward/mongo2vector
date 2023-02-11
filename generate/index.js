
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/Users/patri/Desktop/gpt/gptserver/.env' })
import weaviate from 'weaviate-client'

let url = process.env.DB
let WEAVIATE_HOST = process.env.WEAVIATE_PRODUCT_HOST
let OPEN_API_KEY = process.env.OPENAI_API_KEY

console.log(OPEN_API_KEY)

const client = weaviate.client({
  scheme: 'https',
  host: WEAVIATE_HOST,
  headers: {'X-OpenAI-Api-Key': OPEN_API_KEY},
});

// instruction for the generative module
const generateTask = '"Summarize the selected products and provide prices on each"';

client.graphql
  .get()
  .withClassName('Product')
  .withFields(
    'name ' + 'description ' + 'price ' +
    `_additional {generate(groupedResult:{ task: ${generateTask} }) { groupedResult }}`
  )
  .withNearText({
    concepts: ['drill bits and drills']
  })
  .withLimit(5)
  .do()
  .then(res => {
    console.log(res.data.Get.Product[0]._additional.generate)
  })
  .catch(err => {
    console.error(err)
  });