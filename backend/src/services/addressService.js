const Address = require('../models/Address');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');
const fieldCrypto = require('../utils/crypto');

const EDITABLE_FIELDS = ['fullName', 'phone', 'street', 'city', 'state', 'postalCode', 'country', 'isDefault'];
// Encrypted at rest (AES-256-GCM, see utils/crypto.js) — a customer's phone
// number and street address are PII an attacker with DB read access
// shouldn't get for free just because they compromised the database.
const ENCRYPTED_FIELDS = ['phone', 'street'];

function encryptEditableFields(data) {
  const result = { ...data };
  for (const field of ENCRYPTED_FIELDS) {
    if (result[field] !== undefined) result[field] = fieldCrypto.encrypt(result[field]);
  }
  return result;
}

async function createAddress(userId, data) {
  const address = await Address.create({
    ...encryptEditableFields(pick(data, EDITABLE_FIELDS)),
    user: userId,
  });
  if (address.isDefault) {
    await clearOtherDefaults(userId, address._id);
  }
  return decryptAddress(address);
}

function decryptAddress(doc) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  for (const field of ENCRYPTED_FIELDS) {
    if (obj[field]) obj[field] = fieldCrypto.decrypt(obj[field]);
  }
  return obj;
}

async function listAddresses(userId) {
  const addresses = await Address.find({ user: userId }).sort('-isDefault -createdAt');
  return addresses.map(decryptAddress);
}

async function clearOtherDefaults(userId, exceptId) {
  await Address.updateMany({ user: userId, _id: { $ne: exceptId } }, { isDefault: false });
}



async function updateAddress(userId, addressId, data) {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) throw ApiError.notFound('Address not found');

  Object.assign(address, encryptEditableFields(pick(data, EDITABLE_FIELDS)));
  await address.save();

  if (address.isDefault) {
    await clearOtherDefaults(userId, address._id);
  }

  return decryptAddress(address);
}

async function deleteAddress(userId, addressId) {
  const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
  if (!address) throw ApiError.notFound('Address not found');
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };
