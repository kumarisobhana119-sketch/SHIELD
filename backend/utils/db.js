// ═══════════════════════════════════════════
// SHIELD — Simple JSON File Database Helper
// ═══════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeCollection(collection, data) {
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function findOne(collection, predicate) {
  const data = readCollection(collection);
  return data.find(predicate) || null;
}

function findMany(collection, predicate) {
  const data = readCollection(collection);
  return data.filter(predicate);
}

function insertOne(collection, document) {
  const data = readCollection(collection);
  data.push(document);
  writeCollection(collection, data);
  return document;
}

function updateOne(collection, predicate, updates) {
  const data = readCollection(collection);
  const index = data.findIndex(predicate);
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates };
  writeCollection(collection, data);
  return data[index];
}

function deleteOne(collection, predicate) {
  const data = readCollection(collection);
  const index = data.findIndex(predicate);
  if (index === -1) return false;
  data.splice(index, 1);
  writeCollection(collection, data);
  return true;
}

module.exports = {
  readCollection,
  writeCollection,
  findOne,
  findMany,
  insertOne,
  updateOne,
  deleteOne
};
