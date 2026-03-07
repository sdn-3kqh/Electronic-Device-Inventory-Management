const Location = require('../models/Location');

exports.createLocation = async (data) => {
  // validate hierarchy
  if (data.parentId) {
    const parent = await Location.findById(data.parentId);
    if (!parent) throw new Error('Parent location not found');

    if (data.type === 'floor' && parent.type !== 'building') {
      throw new Error('Floor must belong to a building');
    }

    if (data.type === 'room' && parent.type !== 'floor') {
      throw new Error('Room must belong to a floor');
    }
  } else {
    if (data.type !== 'building') {
      throw new Error('Only building can have no parent');
    }
  }

  const location = new Location(data);
  return await location.save();
};

exports.getAllLocations = async () => {
  return await Location.find()
    .populate('parentId')
    .sort({ createdAt: -1 });
};

exports.getLocationById = async (id) => {
  const location = await Location.findById(id).populate('parentId');
  if (!location) throw new Error('Location not found');
  return location;
};

exports.updateLocation = async (id, data) => {
  const location = await Location.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );

  if (!location) throw new Error('Location not found');
  return location;
};

exports.deleteLocation = async (id) => {
  const child = await Location.findOne({ parentId: id });
  if (child) {
    throw new Error('Cannot delete location with child locations');
  }

  const location = await Location.findByIdAndDelete(id);
  if (!location) throw new Error('Location not found');

  return true;
};