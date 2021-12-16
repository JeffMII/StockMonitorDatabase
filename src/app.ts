import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { startDatabase } from './database/mongo';
import { getStockMetas, getStock, upsertStockDays, upsertStockWeeks, upsertStockMonths, getDecisionModel, upsertDecisionModel, getStockDays, getStockWeeks, getStockMonths, upsertStockMetas } from './database/alpha.market';
import { AlphaVantageService } from './services/alpha.service';
import { Predictor } from './services/predict.service';
import { ErrorResponse, RejectResponse, SuccessResponse } from './types/response.types';
import { Day, Month, Meta, Week } from './types/stock.types';
import { Classifier, Confidence, DecisionData, DecisionModel, Normal, Suggestion } from './types/predict.types';

// const checkJwt = jwt({
//   secret: jwksRsa.expressJwtSecret({
  //     cache: true,
  //     rateLimit: true,
  //     jwksRequestsPerMinute: 5,
  //     jwksUri: `https://<AUTH0_DOMAIN>/.well-known/jwks.json`
  //   }),
  
  //   // Validate the audience and the issuer.
  //   audience: 'https://market-api',
  //   issuer: `https://dev-dm8i7gk3.us.auth0.com/`,
  //   algorithms: ['RS256']
  // });
  
const alpha = new AlphaVantageService();
const predictor = new Predictor();

// defining the Express app
const app = express();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(express.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

// check authorization for the following endpoints
// app.use(checkJwt);

// endpoint to notify that the API is running
app.get('/running', (req, resp) => { resp.send({ running: true}); });

// app.get('/stop', async (req, resp) => {
//   const stopped = await stop().then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
//   resp.send({ stopped: stopped });
//   (await server).close();
//   process.exit(0);
// });


// app.get('/delete/:id', async (req, resp) => {
//   await deleteStock(req.params.id).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
//   resp.send({ success: true });
// });

// endpoint to get all stock metas
app.get('/stock-metas', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getStockMetas().then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  if(r.error) {
    r = await getMetas(r as RejectResponse | ErrorResponse, 0).then(res => { return res; }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
    if(r.error) { resp.status(404); resp.send(r); }
    else resp.send(r);
  }
  else {
    
    let metas : Meta[] | undefined = (r as SuccessResponse).data;
    console.log(metas);
    if(metas && metas.length > 0) { resp.send(r); }
    else {

      r = await getMetas(r as RejectResponse | ErrorResponse, 0).then(res => { return res; }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) { resp.status(404); resp.send(r); }
      else resp.send(r);
    }
  }
});

app.get('/pull/stock-metas', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getMetas(new RejectResponse('Could not get stock meta data from Alpha Vantage'), 0);
  if(r.error) { resp.status(500); resp.send(r); }
  else resp.send(r);
});

async function getMetas(error : RejectResponse | ErrorResponse, count : number) : Promise<SuccessResponse | RejectResponse | ErrorResponse> {
  if(count > 2) return error;
  let r : SuccessResponse | RejectResponse | ErrorResponse = await alpha.getStockMetas().then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  if(r.error) return await getMetas(r as RejectResponse | ErrorResponse, 0).then(res => { return res; }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  else {
    
    let metas : Meta[] = (r as SuccessResponse).data;
    r = await upsertStockMetas(metas).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
    if(r.error) return await getMetas(r as RejectResponse | ErrorResponse, 0).then(res => { return res; }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
    else {
      
      r = await getStockMetas().then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) return await getMetas(r as RejectResponse | ErrorResponse, 0).then(res => { return res; }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      else {

        metas = (r as SuccessResponse).data;
        if(metas && metas.length > 0) return r;
        else return await getMetas(r as RejectResponse | ErrorResponse, 0).then(res => { return res; }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      }
    }
  }
}

// get stock with symbol
app.get('/stock/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getStock(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  if(r.error) { resp.status(404); resp.send(r); }
  else resp.send(r);
});

// get stock days with symbol
app.get('/stock/days/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getStockDays(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  console.log(r);
  if(r.error) {
    
    r = await getDays(req.params.symbol, r as RejectResponse | ErrorResponse, 0);
    if(r.error) { resp.status(404); resp.send(r); }
    else resp.send(r);
  }
  else {
  
    let days : Day[] | undefined = (r as SuccessResponse).data;
    if(days && days.length > 0) { resp.send(r); }
    else {
 
      r = await getDays(req.params.symbol, new RejectResponse('Could not retrieve days from database'), 0);
      if(r.error) { resp.status(404); resp.send(r); }
      else resp.send(r);
    }
  }
});

app.get('/pull/days/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getDays(req.params.symbol, new RejectResponse('Could not get daily stock data from Alpha Vantage'), 0);
  if(r.error) { resp.status(500); resp.send(r); }
  else resp.send(r);
});

async function getDays(symbol : string, error : RejectResponse | ErrorResponse, count : number) : Promise<SuccessResponse | RejectResponse | ErrorResponse> {
  if(count > 2) { return error; }

  let r : SuccessResponse | RejectResponse | ErrorResponse = await alpha.getDays(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });;

  if(r.error) { return await getDays(symbol, r as RejectResponse | ErrorResponse, count++); }
  else {

    let days : Day[] | undefined = (r as SuccessResponse).data;
    if(days && days.length > 0) {
      
      r = await upsertStockDays(days, symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) { return await getDays(symbol, r as RejectResponse | ErrorResponse, count++); }
      else {

        r = await getStockDays(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err);  return new ErrorResponse(err); });
        if(r.error) { return await getDays(symbol, r as RejectResponse | ErrorResponse, count++); }
        else {

          days = (r as SuccessResponse).data;
          if(days && days.length > 0) { return r }
          else { return await getDays(symbol, new RejectResponse('Could not retrieve days from database'), count++); }
        }
      }
    }
    else { return await getDays(symbol, new RejectResponse('Could not retrieve days data from Alpha Vantage'), count++); }
  }
}

// get stock weeks with symbol
app.get('/stock/weeks/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getStockWeeks(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  
  if(r.error) {
    
    r = await getWeeks(req.params.symbol, r as RejectResponse | ErrorResponse, 0);
    if(r.error) { resp.status(404); resp.send(r); }
    else resp.send(r);
  }
  else {
  
    let weeks : Week[] | undefined = (r as SuccessResponse).data.weeks;
    if(weeks && weeks.length > 0) { resp.send(r); }
    else {
 
      r = await getWeeks(req.params.symbol, new RejectResponse('Could not retrieve weeks from database'), 0);
      if(r.error) { resp.status(404); resp.send(r); }
      else resp.send(r);
    }
  }
});

app.get('/pull/weeks/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getWeeks(req.params.symbol, new RejectResponse('Could not get daily stock data from Alpha Vantage'), 0);
  if(r.error) { resp.status(500); resp.send(r); }
  else resp.send(r);
});

async function getWeeks(symbol : string, error : RejectResponse | ErrorResponse, count : number) : Promise<SuccessResponse | RejectResponse | ErrorResponse> {
  if(count > 2) { return error; }

  let r : SuccessResponse | RejectResponse | ErrorResponse = await alpha.getWeeks(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });;

  if(r.error) { return await getWeeks(symbol, r as RejectResponse | ErrorResponse, count++); }
  else {

    let weeks : Week[] | undefined = (r as SuccessResponse).data;
    if(weeks && weeks.length > 0) {
      
      r = await upsertStockWeeks(weeks, symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) { return await getWeeks(symbol, r as RejectResponse | ErrorResponse, count++); }
      else {

        r = await getStockWeeks(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err);  return new ErrorResponse(err); });
        if(r.error) { return await getWeeks(symbol, r as RejectResponse | ErrorResponse, count++); }
        else {

          weeks = (r as SuccessResponse).data;
          if(weeks && weeks.length > 0) { return r }
          else { return await getWeeks(symbol, new RejectResponse('Could not retrieve weeks from database'), count++); }
        }
      }
    }
    else { return await getWeeks(symbol, new RejectResponse('Could not retrieve weeks data from Alpha Vantage'), count++); }
  }
}

// get stock months with symbol
app.get('/stock/months/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getStockMonths(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  
  if(r.error) {
    
    r = await getMonths(req.params.symbol, r as RejectResponse | ErrorResponse, 0);
    if(r.error) { resp.status(404); resp.send(r); }
    else resp.send(r);
  }
  else {
  
    let months : Month[] | undefined = (r as SuccessResponse).data;
    if(months && months.length > 0) { resp.send(r); }
    else {
 
      r = await getMonths(req.params.symbol, new RejectResponse('Could not retrieve months from database'), 0);
      if(r.error) { resp.status(404); resp.send(r); }
      else resp.send(r);
    }
  }
});

app.get('/pull/months/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getMonths(req.params.symbol, new RejectResponse('Could not get daily stock data from Alpha Vantage'), 0);
  if(r.error) { resp.status(500); resp.send(r); }
  else resp.send(r);
});

async function getMonths(symbol : string, error : RejectResponse | ErrorResponse, count : number) : Promise<SuccessResponse | RejectResponse | ErrorResponse> {
  if(count > 2) { return error; }

  let r : SuccessResponse | RejectResponse | ErrorResponse = await alpha.getMonths(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });;

  if(r.error) { return await getMonths(symbol, r as RejectResponse | ErrorResponse, count++); }
  else {

    let months : Month[] | undefined = (r as SuccessResponse).data;
    if(months && months.length > 0) {
      
      r = await upsertStockMonths(months, symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) { return await getMonths(symbol, r as RejectResponse | ErrorResponse, count++); }
      else {

        r = await getStockMonths(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err);  return new ErrorResponse(err); });
        if(r.error) { return await getMonths(symbol, r as RejectResponse | ErrorResponse, count++); }
        else {

          months = (r as SuccessResponse).data;
          if(months && months.length > 0) { return r }
          else { return await getMonths(symbol, new RejectResponse('Could not retrieve months from database'), count++); }
        }
      }
    }
    else { return await getMonths(symbol, new RejectResponse('Could not retrieve months data from Alpha Vantage'), count++); }
  }
}

app.get('/model/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await getDecisionModel(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  if(r.error) { resp.status(404); resp.send(r) }
  else resp.send(r);
});

app.put('/model/:symbol', async (req, resp) => {
  if(req.body?.model) {
    let model = req.body.model;
    let r : SuccessResponse | RejectResponse | ErrorResponse = await upsertDecisionModel(model, req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
    if(r.error) { resp.status(500); resp.send(r); }
    else resp.send(r);
  }
  else { resp.status(400); resp.send(new RejectResponse('Body must contain the model')); }
});

app.get('/train/model/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await predictor.train(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  if(r.error) { resp.status(500); resp.send(r) }
  else {
    let model : DecisionModel = (r as SuccessResponse).data;
    if(model) {
      r = await upsertDecisionModel(model, req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) { resp.status(500); resp.send(r) }
      else resp.send(r);
    }
    else { resp.status(404); resp.send(new RejectResponse('Could not train model')) }
  }
});

app.post('/predict/model/:symbol', async (req, resp) => {
  let data = req.body;
  let day : Day = {} as Day;
  let week : Week = {} as Week;
  let month : Month = {} as Month;
  if(data?.day && data?.week && data?.month) {
    try {
      day = data.day as Day;
      week = data.week as Week;
      month = data.month as Month;
    }
    catch(err) { resp.status(500); resp.send(new ErrorResponse(err)); return; }
    
    let r : SuccessResponse | RejectResponse | ErrorResponse = await predictor.load(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
    if(r.error) { resp.status(500); resp.send(r); }
    else {
      let normal : Normal | undefined = predictor.process(day, week, month);
      let classifier = {} as Classifier;
      if(normal) {
        let data : DecisionData = { normal: normal, classifier: classifier };
        
        r = await predictor.predict(req.params.symbol, data).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
        if(r.error) { resp.status(500); resp.send(r); }
        else resp.send(r);
      }
      else { resp.status(500); resp.send(new ErrorResponse('Could not normalize data')); }
    }
  }
  else { resp.status(400); resp.send(new RejectResponse('Body must contain day, week, and month data')); }
});

app.post('/suggest/model/:symbol', async (req, resp) => {
  let classifier : Classifier = {} as Classifier;
  let data = req.body;
  if(data?.classifier) {
    try { classifier = data.classifier as Classifier; }
    catch(err) { resp.status(500); resp.send(new ErrorResponse(err)); return; }
    
    let suggestion : Suggestion = predictor.suggest(classifier);
    resp.send(new SuccessResponse({ suggestion: suggestion}));
  }
  else { resp.status(400); resp.send(new RejectResponse('Body must contain classifier data')); }
});

app.get('/validate/model/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await predictor.load(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  if(r.error) { resp.status(400); resp.send(new ErrorResponse('Could not load model')); }
  else {
    r = await predictor.test(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });;
    if(r.error) { resp.status(500); resp.send(new ErrorResponse('Could not validate model')); }
    else {
      let validity : Confidence = (r as SuccessResponse).data;
      if(validity) {
        console.log('validity:', validity);
        resp.send(r);
      }
    }
  }
});

app.get('/test/model/:symbol', async (req, resp) => {
  let r : SuccessResponse | RejectResponse | ErrorResponse = await predictor.load(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
  if(r.error) { resp.status(400); resp.send(new ErrorResponse('Could not load model')); }
  else {
    r = await predictor.test(req.params.symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });;
    if(r.error) { resp.status(500); resp.send(new ErrorResponse('Could not test model')); }
    else {
      let confidence : Confidence = (r as SuccessResponse).data;
      if(confidence) {
        console.log('confidence:', confidence);
        resp.send(r);
      }
    }
  }
});

// start the in-memory MongoDB instance
var server = startDatabase().then(() => {
  // start the server
  return app.listen(3001, async () => {
    console.log('listening on port 3001');
  });
});