const locationService = require('../services/locationService');

exports.createLocation = async (req, res) => {
  try {
    const location = await locationService.createLocation(req.body);
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllLocations = async (req, res) => {
  try {
    const locations = await locationService.getAllLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLocationById = async (req, res) => {
  try {
    const location = await locationService.getLocationById(req.params.id);
    res.json(location);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const location = await locationService.updateLocation(
      req.params.id,
      req.body
    );
    res.json(location);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    await locationService.deleteLocation(req.params.id);
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};