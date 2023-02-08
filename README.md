

### LOAD MONGO DATA TO WEAVIATE

* set up .env with Atlas Mongo and Weaviate urls
* npm i
* node index.js
* To confirm data import

https://product.weaviate.network/v1/objects

https://modernization.weaviate.network/v1/object

or 

'''
const weaviate = require('weaviate-client');

const client = weaviate.client({
    scheme: 'https',
    host: 'some-endpoint.weaviate.network/',  // Replace with your endpoint
  }); 

client
    .data
    .getter()
    .do()
    .then(res => {
        console.log(res)
    })
    .catch(err => {
        console.error(err)
    });
'''

### Python batch process with error handling incorporated
import weaviate

client = weaviate.Client("http://localhost:8080")


def check_batch_result(results: dict):
  """
  Check batch results for errors.

  Parameters
  ----------
  results : dict
      The Weaviate batch creation return value, i.e. returned value of the client.batch.create_objects().
  """

  if results is not None:
    for result in results:
      if 'result' in result and 'errors' in result['result']:
        if 'error' in result['result']['errors']:
          print(result['result']['errors']['error'])

object_to_add = {
    "name": "Jane Doe",
    "writesFor": [{
        "beacon": "weaviate://localhost/f81bfe5e-16ba-4615-a516-46c2ae2e5a80"
    }]
}

with client.batch(batch_size=100, callback=check_batch_result) as batch:
  batch.add_data_object(object_to_add, "Author", "36ddd591-2dee-4e7e-a3cc-eb86d30a4303")