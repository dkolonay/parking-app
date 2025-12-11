// server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * 1. API routes FIRST
 *    These should respond and then stop; they must come before static/catch-all.
 */
// Enable CORS for all origins (adjust options for stricter policies)
app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from AWS server' });
});

app.get('/api/map/address-from-coords/:coords', async(req, res)=> {

  const coords = req.params.coords;
  try{

    const mapResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords}&key=${process.env.API_KEY}`)
 
    const data = mapResponse.data;
    const address = data.results[0].address_components

    const formattedData = {}
    address.forEach((item)=>{
      if(item.types.includes("street_number")){
        formattedData.street_num = item.short_name
      }
      if(item.types.includes("route")){
        formattedData.street_name = item.short_name
      }
      if(item.types.includes("sublocality")){
        formattedData.city = item.short_name
      }
      if(item.types.includes("administrative_area_level_1")){
        formattedData.state = item.short_name
      }
      if(item.types.includes("postal_code")){
        formattedData.zip = item.short_name
      }
    })

    res.json(formattedData)
  
  } catch(err){
    res.status(500).send({error: JSON.stringify(err)});
    console.log(err)
  }
});

// Add your other /api/... routes here

/**
 * 2. Serve static React build
 *    This serves JS/CSS/assets from the build folder.
 */
const buildPath = 'dist';
app.use(express.static(buildPath));

/**
 * 3. Catch-all for SPA routes
 *    Anything not handled above gets index.html for client-side routing.
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

/**
 * 4. Start server
 */
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;