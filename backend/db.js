const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.PARKING_TABLE;


async function saveCarLocation(UserId, lat, lng) {
  const params = {
    TableName: TABLE_NAME,
    Item: { UserId, lat, lng, timestamp: new Date().toISOString() }
  };
  await dynamo.put(params).promise();
  return { latLng: `${lat},${lng}` };
}

async function getCarLocation(userSub) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      UserId: userSub,
    },
  };

  const result = await dynamo.get(params).promise();
  return result.Item;
}

module.exports ={saveCarLocation, getCarLocation};