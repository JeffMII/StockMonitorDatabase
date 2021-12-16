import { MongoMemoryServer } from 'mongodb-memory-server';
import { Db, MongoClient } from 'mongodb';
import { Environment } from '../../environment';

var mongo : MongoMemoryServer | undefined;
var database : Db | undefined;
var url = Environment.dbURL;

export async function startDatabase() {
  mongo = await MongoMemoryServer.create().then((res : any) => { return res; }, (rej : any) => { console.error(rej); return undefined; }).catch(err => { console.error(err.message); return undefined; });
  const connection = await MongoClient.connect(url).then((res : any) => { return res; }, (rej : any) => { console.error(rej); return undefined; }).catch(err => { console.error(err.message); return undefined; });
  if(connection) database = connection.db();
  return database;
}

export async function getDatabase() {
  if (!database) await startDatabase().then((res : any) => { return res; }, (rej : any) => { console.error(rej); return undefined; }).catch(err => { console.error(err.message); return undefined; });
  return database;
}

export async function stop() {
  if(mongo) return await mongo.stop().then((res : any) => { return res; }, (rej : any) => { console.error(rej); return false; }).catch(err => { console.error(err.message); return false; });
  else return true;
}