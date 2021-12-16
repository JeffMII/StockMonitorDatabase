import { Db, ObjectId } from 'mongodb';
import { DecisionModel } from 'src/types/predict.types';
import { Day, Month, Meta, Week } from 'src/types/stock.types';
import { getDatabase } from './mongo';

const market = 'alpha';

export async function deleteStock(id : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).deleteOne({ _id: new ObjectId(id) }).then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  else throw new Error('Could not get database instance')
}

export async function getStockMetas() {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).find({ meta: { $exists: true } }, { projection: { meta: true, _id: false } }).toArray().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  else throw new Error('Could not get database instance')
}

export async function getStock(symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).findOne({ meta: { symbol: symbol }, months: { $exists: true }, weeks: { $exists: true }, days: { $exists: true } }).then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.log(err); throw new Error('Could not get database instance') });
  else throw new Error('Could not get database instance')
}

export async function getStocks() {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).find({ meta: { $exists: true }, months: { $exists: true }, weeks: { $exists: true }, days: { $exists: true } }, { projection: { meta: true, months: true, weeks: true, days: true, _id: false } }).toArray().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.log(err); throw new Error('Could not get database instance') });
  else throw new Error('Could not get database instance')
}

export async function getStockDays(symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).findOne({ meta: { symbol: symbol }, days: { $exists: true } }, { projection: { meta: { symbol: true }, days: true, _id: false } }).then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.log(err); throw new Error('Could not get database instance') });
  else throw new Error('Could not get database instance')
}

export async function getStockWeeks(symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).findOne({ meta: { symbol: symbol }, weeks: { $exists: true } }, { projection: { meta: { symbol: true }, weeks: true, _id: false } }).then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.log(err); throw new Error('Could not get database instance') });
  else throw new Error('Could not get database instance')
}

export async function getStockMonths(symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).findOne({ meta: { symbol: symbol }, months: { $exists: true } }, { projection: { meta: { symbol: true }, months: true, _id: false } }).then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.log(err); throw new Error('Could not get database instance') });
  else throw new Error('Could not get database instance')
}

export async function getDecisionModel(symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).findOne({ meta: { symbol: symbol }, model: { $exists: true } }, { projection: { meta: { symbol: true }, model: true, _id: false } }).then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.log(err); throw new Error('Could not get database instance') });
  else throw new Error('Could not get database instance')
}

export async function upsertStockMeta(meta : Meta) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).updateOne({ meta: { symbol: meta.symbol } }, { $set: { meta: meta } }, { upsert: true }).then(res => { return res; }, rej => { console.error(rej); return rej; }).catch(err => { console.error(err); return err; });
  else throw new Error('Could not get database instance')
}

export async function upsertStockMetas(metas : Meta[]) {
  return metas.map(async meta => { return await upsertStockMeta(meta).then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') }) });
}

export async function upsertStockDays(days : Day[], symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).updateOne({ meta: { symbol: symbol } }, { $set: { days: days } }, { upsert: true }).then(res => { return res; }, rej => { console.error(rej); return rej; }).catch(err => { console.error(err); return err; });
  else throw new Error('Could not get database instance')
}

export async function upsertStockWeeks(weeks : Week[], symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).updateOne({ meta: { symbol: symbol } }, { $set: { weeks: weeks } }, { upsert: true }).then(res => { return res; }, rej => { console.error(rej); return rej; }).catch(err => { console.error(err); return err; });
  else throw new Error('Could not get database instance')
}

export async function upsertStockMonths(months : Month[], symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).updateOne({ meta: { symbol: symbol } }, { $set: { months: months } }, { upsert: true }).then(res => { return res; }, rej => { console.error(rej); return rej; }).catch(err => { console.error(err); return err; });
  else throw new Error('Could not get database instance')
}

export async function upsertDecisionModel(model : DecisionModel, symbol : string) {
  const database = await getDatabase().then(res => { return res; }, rej => { console.error(rej); throw new Error('Could not get database instance') }).catch(err => { console.error(err); throw new Error('Could not get database instance') });
  if(database instanceof Db) return await database.collection(market).updateOne({ meta: { symbol: symbol } }, { $set: { model: model } }, { upsert: true }).then(res => { return res; }, rej => { console.error(rej); return rej; }).catch(err => { console.error(err); return err; });
  else throw new Error('Could not get database instance');
}