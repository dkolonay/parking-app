// server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const { saveCarLocation, getCarLocation } = require('./db');
const {verifyToken} = require('./auth')
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

// Save car coordinates (requires auth)
app.post('/api/parking-location', verifyToken, async (req, res) => {
  console.log("Authenticated user sub:", req.user.sub);
  console.log("Request body:", req.body);

  try {
    const { sub } = req.user;
    const { lat, lng } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid coordinates' });
    }

    const result = await saveCarLocation(sub, lat, lng);

    res.json({
      success: true,
      location: {
        lat,
        lng,
      },
      timestamp: result.timestamp,
    });
  } catch (err) {
    console.error('Failed to save parking location:', err);
    res.status(500).json({ error: 'Failed to save location' });
  }
});

// Get all parked cars for logged-in user
app.get('/api/parking-location', verifyToken, async (req, res) => {
  try {
    const { sub } = req.user;
    const carLocation = await getCarLocation(sub);
    res.json(carLocation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get cars' });
  }
});



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