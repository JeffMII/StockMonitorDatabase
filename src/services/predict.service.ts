import { Day, Month, Stock, Week } from "src/types/stock.types";
import { NormalData, Classifier, Outcome, Suggestion, DecisionModel, Normal, Stamps, Prepared, DecisionData, DecisionMatrix, DataRange, PreparedData, Samples, Confidence } from "../types/predict.types";
import { Matrix } from "src/types/predict.types";
import { getDecisionModel, getStock } from "../database/alpha.market";
import { SuccessResponse, RejectResponse, ErrorResponse } from "../types/response.types";

export class Predictor {

  public model : DecisionModel = {} as DecisionModel;
  
  constructor() {}

  public async load(symbol : string) : Promise<DecisionModel> {
    let r : SuccessResponse | RejectResponse | ErrorResponse = await getDecisionModel(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
    if(r.error) throw new Error('Could not load decision model for symbol ' + symbol);
    else{
      let model : DecisionModel = (r as SuccessResponse).data.model;
      if(model) { this.model = model; console.log('loaded model'); return model; }
      else throw new Error('Could not load decision model for symbol ' + symbol);
    }
  }

  public async train(symbol : string, grain? : number) : Promise<DecisionModel> {
    let r : SuccessResponse | RejectResponse | ErrorResponse = await getStock(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
    if(r.error) throw new Error('Could not get stock data for symbol ' + symbol);
    else {
      let stock : Stock = (r as SuccessResponse).data;
      if(stock) {
        let samples : Samples = this.processData(stock, grain);
        if(samples.testing.length == 0 || samples.training.length == 0) throw new Error('Could not successfully process stock data for training and testing for symbol ' + symbol);
        else {
          this.build(samples);
          this.validate(symbol);
          this.test(symbol);
          return this.model;
        }
      }
      else throw new Error('Could not get stock data for symbol ' + symbol);
    }
  }

  private processData(stock : Stock, grain? : number) : Samples {
    if(!this.model) this.model = {} as DecisionModel;

    let prep : Prepared[] = [];
    
    prep = this.prepareData(stock);
    
    let normals : Normal[] = [];
    let classifier : Classifier[] = [];
    
    this.model.classifiers = this.classifiers();
    this.model.normals = this.normals(prep);
    normals = this.normalizeData(prep);
    classifier = this.classifyData(prep);
    normals.shift();
    
    let training : DecisionData[] = [];
    this.model.tests = [];
    let testsize = Math.floor((normals.length / 10));
    for(let i = 0; i < testsize; i++) {
      let rand = Math.floor((normals.length - 1) * Math.random());
      this.model.tests.push({ normal: normals.splice(rand, 1)[0], classifier: classifier.splice(rand, 1)[0] });
    }
    this.model.valids = [];
    for(let i = 0; i < testsize; i++) {
      let rand = Math.floor((normals.length - 1) * Math.random());
      this.model.valids.push({ normal: normals[rand], classifier: classifier[rand] });
    }
    for(let i = 0; i < normals.length; i++) {
      training.push({ normal: normals[i], classifier: classifier[i] });
    }
    return { training: training, testing: this.model.tests, validating: this.model.valids };
  }

  private prepareData(stock : Stock) : Prepared[] {
    // console.log('Preparing data...');
    let data : Prepared[] = [];

    stock.days.forEach(day => {
      let prep : Prepared = { stamps: {} as Stamps, data: {} as PreparedData } as Prepared;
      prep.stamps.dailytimestamp = day.timestamp,
      prep.data.dailyadjusted = day.stats.adjusted,
      prep.data.dailydividend = day.stats.dividend,
      prep.data.dailyopen = day.stats.open,
      prep.data.dailyhigh = day.stats.high,
      prep.data.dailylow = day.stats.low,
      prep.data.dailyclose = day.stats.close,
      prep.data.dailyvolume = day.stats.volume,
      prep.data.dailyobv = day.analysis.obv,
      prep.data.dailyad = day.analysis.ad,
      prep.data.dailyadx = day.analysis.adx,
      prep.data.dailymacdopenvalue = day.analysis.macd.open.value,
      prep.data.dailymacdhighvalue = day.analysis.macd.high.value,
      prep.data.dailymacdlowvalue = day.analysis.macd.low.value,
      prep.data.dailymacdclosevalue = day.analysis.macd.close.value,
      prep.data.dailymacdopenhistory = day.analysis.macd.open.history,
      prep.data.dailymacdhighhistory = day.analysis.macd.high.history,
      prep.data.dailymacdlowhistory = day.analysis.macd.low.history,
      prep.data.dailymacdclosehistory = day.analysis.macd.close.history,
      prep.data.dailymacdopensignal = day.analysis.macd.open.signal,
      prep.data.dailymacdhighsignal = day.analysis.macd.high.signal,
      prep.data.dailymacdlowsignal = day.analysis.macd.low.signal,
      prep.data.dailymacdclosesignal = day.analysis.macd.close.signal,
      prep.data.dailysmaopen = day.analysis.sma.open,
      prep.data.dailysmahigh = day.analysis.sma.high,
      prep.data.dailysmalow = day.analysis.sma.low,
      prep.data.dailysmaclose = day.analysis.sma.close,
      prep.data.dailyemaopen = day.analysis.ema.open,
      prep.data.dailyemahigh = day.analysis.ema.high,
      prep.data.dailyemalow = day.analysis.ema.low,
      prep.data.dailyemaclose = day.analysis.ema.close,
      prep.data.dailyrsiopen = day.analysis.rsi.open,
      prep.data.dailyrsihigh = day.analysis.rsi.high,
      prep.data.dailyrsilow = day.analysis.rsi.low,
      prep.data.dailyrsiclose = day.analysis.rsi.close,
      prep.data.dailyaroonup = day.analysis.aroon.up,
      prep.data.dailyaroondown = day.analysis.aroon.down
      let found = false;
      for(let week of stock.weeks) {
        let start = new Date(week.timestamp);
        let end = new Date(week.timestamp);
        start.setDate(start.getDate() - 4);
        if(day.timestamp.valueOf() >= start.valueOf() && day.timestamp.valueOf() <= end.valueOf()) {
          prep.stamps.weeklytimestamp = week.timestamp;
          prep.data.weeklyadjusted = week.stats.adjusted;
          prep.data.weeklydividend = week.stats.dividend;
          prep.data.weeklyopen = week.stats.open;
          prep.data.weeklyhigh = week.stats.high;
          prep.data.weeklylow = week.stats.low;
          prep.data.weeklyclose = week.stats.close;
          prep.data.weeklyvolume = week.stats.volume;
          prep.data.weeklyobv = week.analysis.obv;
          prep.data.weeklyad = week.analysis.ad;
          prep.data.weeklyadx = week.analysis.adx;
          prep.data.weeklymacdopenvalue = week.analysis.macd.open.value;
          prep.data.weeklymacdhighvalue = week.analysis.macd.high.value;
          prep.data.weeklymacdlowvalue = week.analysis.macd.low.value;
          prep.data.weeklymacdclosevalue = week.analysis.macd.close.value;
          prep.data.weeklymacdopenhistory = week.analysis.macd.open.history;
          prep.data.weeklymacdhighhistory = week.analysis.macd.high.history;
          prep.data.weeklymacdlowhistory = week.analysis.macd.low.history;
          prep.data.weeklymacdclosehistory = week.analysis.macd.close.history;
          prep.data.weeklymacdopensignal = week.analysis.macd.open.signal;
          prep.data.weeklymacdhighsignal = week.analysis.macd.high.signal;
          prep.data.weeklymacdlowsignal = week.analysis.macd.low.signal;
          prep.data.weeklymacdclosesignal = week.analysis.macd.close.signal;
          prep.data.weeklysmaopen = week.analysis.sma.open;
          prep.data.weeklysmahigh = week.analysis.sma.high;
          prep.data.weeklysmalow = week.analysis.sma.low;
          prep.data.weeklysmaclose = week.analysis.sma.close;
          prep.data.weeklyemaopen = week.analysis.ema.open;
          prep.data.weeklyemahigh = week.analysis.ema.high;
          prep.data.weeklyemalow = week.analysis.ema.low;
          prep.data.weeklyemaclose = week.analysis.ema.close;
          prep.data.weeklyrsiopen = week.analysis.rsi.open;
          prep.data.weeklyrsihigh = week.analysis.rsi.high;
          prep.data.weeklyrsilow = week.analysis.rsi.low;
          prep.data.weeklyrsiclose = week.analysis.rsi.close;
          prep.data.weeklyaroonup = week.analysis.aroon.up;
          prep.data.weeklyaroondown = week.analysis.aroon.down;
          found = true;
          break;
        }
      }
      if(!found) return;
      found = false;
      for(let month of stock.months) {
        if(day.timestamp.getFullYear() == month.timestamp.getFullYear() && day.timestamp.getMonth() == month.timestamp.getMonth()) {
          prep.stamps.monthlytimestamp = month.timestamp;
          prep.data.monthlyadjusted = month.stats.adjusted;
          prep.data.monthlydividend = month.stats.dividend;
          prep.data.monthlyopen = month.stats.open;
          prep.data.monthlyhigh = month.stats.high;
          prep.data.monthlylow = month.stats.low;
          prep.data.monthlyclose = month.stats.close;
          prep.data.monthlyvolume = month.stats.volume;
          prep.data.monthlyobv = month.analysis.obv;
          prep.data.monthlyad = month.analysis.ad;
          prep.data.monthlyadx = month.analysis.adx;
          prep.data.monthlymacdopenvalue = month.analysis.macd.open.value;
          prep.data.monthlymacdhighvalue = month.analysis.macd.high.value;
          prep.data.monthlymacdlowvalue = month.analysis.macd.low.value;
          prep.data.monthlymacdclosevalue = month.analysis.macd.close.value;
          prep.data.monthlymacdopenhistory = month.analysis.macd.open.history;
          prep.data.monthlymacdhighhistory = month.analysis.macd.high.history;
          prep.data.monthlymacdlowhistory = month.analysis.macd.low.history;
          prep.data.monthlymacdclosehistory = month.analysis.macd.close.history;
          prep.data.monthlymacdopensignal = month.analysis.macd.open.signal;
          prep.data.monthlymacdhighsignal = month.analysis.macd.high.signal;
          prep.data.monthlymacdlowsignal = month.analysis.macd.low.signal;
          prep.data.monthlymacdclosesignal = month.analysis.macd.close.signal;
          prep.data.monthlysmaopen = month.analysis.sma.open;
          prep.data.monthlysmahigh = month.analysis.sma.high;
          prep.data.monthlysmalow = month.analysis.sma.low;
          prep.data.monthlysmaclose = month.analysis.sma.close;
          prep.data.monthlyemaopen = month.analysis.ema.open;
          prep.data.monthlyemahigh = month.analysis.ema.high;
          prep.data.monthlyemalow = month.analysis.ema.low;
          prep.data.monthlyemaclose = month.analysis.ema.close;
          prep.data.monthlyrsiopen = month.analysis.rsi.open;
          prep.data.monthlyrsihigh = month.analysis.rsi.high;
          prep.data.monthlyrsilow = month.analysis.rsi.low;
          prep.data.monthlyrsiclose = month.analysis.rsi.close;
          prep.data.monthlyaroonup = month.analysis.aroon.up;
          prep.data.monthlyaroondown = month.analysis.aroon.down;
          found = true;
          break;
        }
      }
      if(!found) return;
      data.push(prep);
    });
    // console.log('...data prepared');
    return data;
  }
  
  private normals(prep : Prepared[], grain? : number) : Normal[] {
    // console.log('Calculating normals...');
    if(!grain) grain = 20;
    
    let keys = Object.keys(prep[0].data);
    
    this.model.normals = [];
    var low : PreparedData = {} as PreparedData;
    var high : PreparedData = {} as PreparedData;

    for(let key of keys) {
      low[key] = prep[0].data[key];
      high[key] = prep[0].data[key];
    }

    for(let key of keys) {
      for(let i = 0; i < prep.length; i++) {
        if(prep[i].data[key] < low[key]) low[key] = prep[i].data[key];
        if(prep[i].data[key] > high[key]) high[key] = prep[i].data[key];
      }
    }

    for(let i = grain, j = 1; i > 0 && j <= grain; i--, j++) {
      let norm : NormalData = {} as NormalData;
      keys.forEach(key => {
        low[key] = Math.floor(low[key]);
        high[key] = Math.ceil(high[key]);
        let abs = (-low[key]) + high[key];
        if(!key.includes('timestamp')) {
          let l = Math.floor(high[key] - (i / grain!) * abs);
          let h = Math.floor(low[key] + (j / grain!) * abs);
          norm[key] = { low: l, high: h };
        }
      });
      this.model.normals.push({ data: norm, stamps: { dailytimestamp: new Date(Date.now()), weeklytimestamp: new Date(Date.now()), monthlytimestamp: new Date(Date.now()) } });
    }
    // console.log('...normals calculated');
    return this.model.normals;
  }

  private normalizeData(prep : Prepared[]) : Normal[] {
    // console.log('Normalizing data...');
    let normals : Normal[] = [];
    let nkeys : string[] = Object.keys(this.model.normals[0].data);
    let skeys : string[] = Object.keys(this.model.normals[0].stamps);

    prep.forEach((p, i) => {
      let norm : Normal = { data: {} as NormalData, stamps: {} as Stamps} as Normal;

      skeys.forEach(key => norm.stamps[key] = p.stamps[key]);

      nkeys.forEach(key => {
        for(let i = 0; i < this.model.normals.length; i++) {
          let low = this.model.normals[i].data[key].low;
          let high = this.model.normals[i].data[key].high;
          if(p.data[key] >= low && p.data[key] <= high) {
            norm.data[key] = { low: low, high: high };
            break;
          }
        }
      });
      normals.push(norm);
    });
    // console.log('...data normalized');
    return normals;
  }

  private classifiers() : Classifier[] {
    // console.log('Gathering classifiers...');
    this.model.classifiers = [];
    this.model.classifiers.push({
      dailyoutcome: Outcome.MostPositive,
      weeklyoutcome: Outcome.MostPositive,
      monthlyoutcome: Outcome.MostPositive,
    });
    this.model.classifiers.push({
      dailyoutcome: Outcome.VeryPositive,
      weeklyoutcome: Outcome.VeryPositive,
      monthlyoutcome: Outcome.VeryPositive,
    });
    this.model.classifiers.push({
      dailyoutcome: Outcome.Positive,
      weeklyoutcome: Outcome.Positive,
      monthlyoutcome: Outcome.Positive,
    });
    this.model.classifiers.push({
      dailyoutcome: Outcome.Neutral,
      weeklyoutcome: Outcome.Neutral,
      monthlyoutcome: Outcome.Neutral,
    });
    this.model.classifiers.push({
      dailyoutcome: Outcome.Negative,
      weeklyoutcome: Outcome.Negative,
      monthlyoutcome: Outcome.Negative,
    });
    this.model.classifiers.push({
      dailyoutcome: Outcome.VeryNegative,
      weeklyoutcome: Outcome.VeryNegative,
      monthlyoutcome: Outcome.VeryNegative,
    });
    this.model.classifiers.push({
      dailyoutcome: Outcome.MostNegative,
      weeklyoutcome: Outcome.MostNegative,
      monthlyoutcome: Outcome.MostNegative,
    });
    // console.log('...classifiers gathered');
    return this.model.classifiers;
  }

  private classifyData(prep : Prepared[]) : Classifier[] {
    if(prep.length == 0) return [];
    // console.log('Classifying data...');

    let classes : Classifier[] = [];
    let keys = Object.keys(this.model.normals[0].data);

    let dailyoutcomeMostPositive = 0;
    let dailyoutcomeVeryPositive = 0;
    let dailyoutcomePositive = 0;
    let dailyoutcomeNeutral = 0;
    let dailyoutcomeNegative = 0;
    let dailyoutcomeVeryNegative = 0;
    let dailyoutcomeMostNegative = 0;

    let weeklyoutcomeMostPositive = 0;
    let weeklyoutcomeVeryPositive = 0;
    let weeklyoutcomePositive = 0;
    let weeklyoutcomeNeutral = 0;
    let weeklyoutcomeNegative = 0;
    let weeklyoutcomeVeryNegative = 0;
    let weeklyoutcomeMostNegative = 0;

    let monthlyoutcomeMostPositive = 0;
    let monthlyoutcomeVeryPositive = 0;
    let monthlyoutcomePositive = 0;
    let monthlyoutcomeNeutral = 0;
    let monthlyoutcomeNegative = 0;
    let monthlyoutcomeVeryNegative = 0;
    let monthlyoutcomeMostNegative = 0;

    for(let i = prep.length - 1; i > 0; i--) {
      let cls : Classifier = {
        dailyoutcome: Outcome.Neutral,
        weeklyoutcome: Outcome.Neutral,
        monthlyoutcome: Outcome.Neutral
      };
      let found = false;
      for(let key of keys) {
        if(key.includes('daily')) {
          found = true;
          if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 1 < prep[i - 1].data[key])       {cls.dailyoutcome = Outcome.MostPositive; dailyoutcomeMostPositive++;}
          else if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 0.1 < prep[i - 1].data[key]) {cls.dailyoutcome = Outcome.VeryPositive; dailyoutcomeVeryPositive++;}
          else if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 0.01 < prep[i - 1].data[key]) {cls.dailyoutcome = Outcome.Positive; dailyoutcomePositive++;}
          else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 1 > prep[i - 1].data[key])  {cls.dailyoutcome = Outcome.MostNegative; dailyoutcomeMostNegative++;}
          else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 0.1 > prep[i - 1].data[key]) {cls.dailyoutcome = Outcome.VeryNegative; dailyoutcomeVeryNegative++;}
          else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 0.01 > prep[i - 1].data[key]) {cls.dailyoutcome = Outcome.Negative; dailyoutcomeNegative++;}
          else dailyoutcomeNeutral++;
        }
        else if(key.includes('weekly')) {
          for(let j = 0; i - j > 0; j++) {
            if(prep[i].stamps.weeklytimestamp.valueOf() < prep[i - j].stamps.weeklytimestamp.valueOf()) {
              found = true;
              if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 1 < prep[i - j].data[key])       {cls.weeklyoutcome = Outcome.MostPositive; weeklyoutcomeMostPositive++;}
              else if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 0.1 < prep[i - j].data[key]) {cls.weeklyoutcome = Outcome.VeryPositive; weeklyoutcomeVeryPositive++;}
              else if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 0.01 < prep[i - j].data[key]) {cls.weeklyoutcome = Outcome.Positive; weeklyoutcomePositive++;}
              else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 1 > prep[i - j].data[key])  {cls.weeklyoutcome = Outcome.MostNegative; weeklyoutcomeMostNegative++;}
              else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 0.1 > prep[i - j].data[key]) {cls.weeklyoutcome = Outcome.VeryNegative; weeklyoutcomeVeryNegative++;}
              else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 0.01 > prep[i - j].data[key]) {cls.weeklyoutcome = Outcome.Negative; weeklyoutcomeNegative++;}
              else weeklyoutcomeNeutral++;
              break;
            }
          }
        }
        else if(key.includes('monthly')) {
          for(let j = 1; i - j > 0; j++) {
            if(prep[i].stamps.monthlytimestamp.valueOf() < prep[i - j].stamps.monthlytimestamp.valueOf()) {
              found = true;
              if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 1 < prep[i - j].data[key])       {cls.monthlyoutcome = Outcome.MostPositive; monthlyoutcomeMostPositive++;}
              else if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 0.1 < prep[i - j].data[key]) {cls.monthlyoutcome = Outcome.VeryPositive; monthlyoutcomeVeryPositive++;}
              else if(prep[i].data[key] + Math.abs(prep[i].data[key]) * 0.01 < prep[i - j].data[key]) {cls.monthlyoutcome = Outcome.Positive; monthlyoutcomePositive++;}
              else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 1 > prep[i - j].data[key])  {cls.monthlyoutcome = Outcome.MostNegative; monthlyoutcomeMostNegative++;}
              else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 0.1 > prep[i - j].data[key]) {cls.monthlyoutcome = Outcome.VeryNegative; monthlyoutcomeVeryNegative++;}
              else if(prep[i].data[key] - Math.abs(prep[i].data[key]) * 0.01 > prep[i - j].data[key]) {cls.monthlyoutcome = Outcome.Negative; monthlyoutcomeNegative++;}
              else monthlyoutcomeNeutral++;
              break;
            }
          }
        }
      }
      classes.unshift(cls);
    }
    // console.log('...data classified');
    return classes;
  }

  public process(day : Day, week : Week, month : Month) : Normal | undefined {
    if(!this.model.normals || this.model.normals.length == 0) return undefined;
    let prep = this.prepare(day, week, month);
    let normal = this.normalize(prep);
    return normal;
  }

  private prepare(day : Day, week : Week, month : Month) : Prepared {
    // console.log('Preparing data...');
    let prep : Prepared = { stamps: {} as Stamps, data: {} as PreparedData } as Prepared;
    prep.stamps.dailytimestamp = day.timestamp;
    prep.data.dailyadjusted = day.stats.adjusted;
    prep.data.dailydividend = day.stats.dividend;
    prep.data.dailyopen = day.stats.open;
    prep.data.dailyhigh = day.stats.high;
    prep.data.dailylow = day.stats.low;
    prep.data.dailyclose = day.stats.close;
    prep.data.dailyvolume = day.stats.volume;
    prep.data.dailyobv = day.analysis.obv;
    prep.data.dailyad = day.analysis.ad;
    prep.data.dailyadx = day.analysis.adx;
    prep.data.dailymacdopenvalue = day.analysis.macd.open.value;
    prep.data.dailymacdhighvalue = day.analysis.macd.high.value;
    prep.data.dailymacdlowvalue = day.analysis.macd.low.value;
    prep.data.dailymacdclosevalue = day.analysis.macd.close.value;
    prep.data.dailymacdopenhistory = day.analysis.macd.open.history;
    prep.data.dailymacdhighhistory = day.analysis.macd.high.history;
    prep.data.dailymacdlowhistory = day.analysis.macd.low.history;
    prep.data.dailymacdclosehistory = day.analysis.macd.close.history;
    prep.data.dailymacdopensignal = day.analysis.macd.open.signal;
    prep.data.dailymacdhighsignal = day.analysis.macd.high.signal;
    prep.data.dailymacdlowsignal = day.analysis.macd.low.signal;
    prep.data.dailymacdclosesignal = day.analysis.macd.close.signal;
    prep.data.dailysmaopen = day.analysis.sma.open;
    prep.data.dailysmahigh = day.analysis.sma.high;
    prep.data.dailysmalow = day.analysis.sma.low;
    prep.data.dailysmaclose = day.analysis.sma.close;
    prep.data.dailyemaopen = day.analysis.ema.open;
    prep.data.dailyemahigh = day.analysis.ema.high;
    prep.data.dailyemalow = day.analysis.ema.low;
    prep.data.dailyemaclose = day.analysis.ema.close;
    prep.data.dailyrsiopen = day.analysis.rsi.open;
    prep.data.dailyrsihigh = day.analysis.rsi.high;
    prep.data.dailyrsilow = day.analysis.rsi.low;
    prep.data.dailyrsiclose = day.analysis.rsi.close;
    prep.data.dailyaroonup = day.analysis.aroon.up;
    prep.data.dailyaroondown = day.analysis.aroon.down;

    prep.stamps.weeklytimestamp = week.timestamp;
    prep.data.weeklyadjusted = week.stats.adjusted;
    prep.data.weeklydividend = week.stats.dividend;
    prep.data.weeklyopen = week.stats.open;
    prep.data.weeklyhigh = week.stats.high;
    prep.data.weeklylow = week.stats.low;
    prep.data.weeklyclose = week.stats.close;
    prep.data.weeklyvolume = week.stats.volume;
    prep.data.weeklyobv = week.analysis.obv;
    prep.data.weeklyad = week.analysis.ad;
    prep.data.weeklyadx = week.analysis.adx;
    prep.data.weeklymacdopenvalue = week.analysis.macd.open.value;
    prep.data.weeklymacdhighvalue = week.analysis.macd.high.value;
    prep.data.weeklymacdlowvalue = week.analysis.macd.low.value;
    prep.data.weeklymacdclosevalue = week.analysis.macd.close.value;
    prep.data.weeklymacdopenhistory = week.analysis.macd.open.history;
    prep.data.weeklymacdhighhistory = week.analysis.macd.high.history;
    prep.data.weeklymacdlowhistory = week.analysis.macd.low.history;
    prep.data.weeklymacdclosehistory = week.analysis.macd.close.history;
    prep.data.weeklymacdopensignal = week.analysis.macd.open.signal;
    prep.data.weeklymacdhighsignal = week.analysis.macd.high.signal;
    prep.data.weeklymacdlowsignal = week.analysis.macd.low.signal;
    prep.data.weeklymacdclosesignal = week.analysis.macd.close.signal;
    prep.data.weeklysmaopen = week.analysis.sma.open;
    prep.data.weeklysmahigh = week.analysis.sma.high;
    prep.data.weeklysmalow = week.analysis.sma.low;
    prep.data.weeklysmaclose = week.analysis.sma.close;
    prep.data.weeklyemaopen = week.analysis.ema.open;
    prep.data.weeklyemahigh = week.analysis.ema.high;
    prep.data.weeklyemalow = week.analysis.ema.low;
    prep.data.weeklyemaclose = week.analysis.ema.close;
    prep.data.weeklyrsiopen = week.analysis.rsi.open;
    prep.data.weeklyrsihigh = week.analysis.rsi.high;
    prep.data.weeklyrsilow = week.analysis.rsi.low;
    prep.data.weeklyrsiclose = week.analysis.rsi.close;
    prep.data.weeklyaroonup = week.analysis.aroon.up;
    prep.data.weeklyaroondown = week.analysis.aroon.down;

    prep.stamps.monthlytimestamp = month.timestamp;
    prep.data.monthlyadjusted = month.stats.adjusted;
    prep.data.monthlydividend = month.stats.dividend;
    prep.data.monthlyopen = month.stats.open;
    prep.data.monthlyhigh = month.stats.high;
    prep.data.monthlylow = month.stats.low;
    prep.data.monthlyclose = month.stats.close;
    prep.data.monthlyvolume = month.stats.volume;
    prep.data.monthlyobv = month.analysis.obv;
    prep.data.monthlyad = month.analysis.ad;
    prep.data.monthlyadx = month.analysis.adx;
    prep.data.monthlymacdopenvalue = month.analysis.macd.open.value;
    prep.data.monthlymacdhighvalue = month.analysis.macd.high.value;
    prep.data.monthlymacdlowvalue = month.analysis.macd.low.value;
    prep.data.monthlymacdclosevalue = month.analysis.macd.close.value;
    prep.data.monthlymacdopenhistory = month.analysis.macd.open.history;
    prep.data.monthlymacdhighhistory = month.analysis.macd.high.history;
    prep.data.monthlymacdlowhistory = month.analysis.macd.low.history;
    prep.data.monthlymacdclosehistory = month.analysis.macd.close.history;
    prep.data.monthlymacdopensignal = month.analysis.macd.open.signal;
    prep.data.monthlymacdhighsignal = month.analysis.macd.high.signal;
    prep.data.monthlymacdlowsignal = month.analysis.macd.low.signal;
    prep.data.monthlymacdclosesignal = month.analysis.macd.close.signal;
    prep.data.monthlysmaopen = month.analysis.sma.open;
    prep.data.monthlysmahigh = month.analysis.sma.high;
    prep.data.monthlysmalow = month.analysis.sma.low;
    prep.data.monthlysmaclose = month.analysis.sma.close;
    prep.data.monthlyemaopen = month.analysis.ema.open;
    prep.data.monthlyemahigh = month.analysis.ema.high;
    prep.data.monthlyemalow = month.analysis.ema.low;
    prep.data.monthlyemaclose = month.analysis.ema.close;
    prep.data.monthlyrsiopen = month.analysis.rsi.open;
    prep.data.monthlyrsihigh = month.analysis.rsi.high;
    prep.data.monthlyrsilow = month.analysis.rsi.low;
    prep.data.monthlyrsiclose = month.analysis.rsi.close;
    prep.data.monthlyaroonup = month.analysis.aroon.up;
    prep.data.monthlyaroondown = month.analysis.aroon.down;
    // console.log('...data prepared');
    return prep;
  }

  private normalize(prep : Prepared) : Normal {
    // console.log('Normalizing data...');
    let normal : Normal = { stamps: prep.stamps, data: {} as NormalData } as Normal;
    let keys = Object.keys(prep.data);
    for(let key of keys) {
      for(let norm of this.model.normals) {
        let low = norm.data[key].low;
        let high = norm.data[key].high;
        if(prep.data[key] >= low && prep.data[key] <= high) {
          normal.data[key] = norm.data[key];
          break;
        }
      }
    }
    // console.log('...data normalized');
    return normal;
  }
  
  private normalOccurrance(classkey : string, data : DecisionData[]) : Matrix { // Normal Occurrance Matrix keys = [nk][ck][nv][cv]
    // console.log('Calculating normal occurrances...');
    let matrix : Matrix = {} as Matrix;
    let normalkeys = Object.keys(this.model.normals[0].data);
    let ck = classkey;
    
    for(let nk of normalkeys) {
      matrix[nk] = { [ck]: {} as Matrix } as Matrix;
      let normalvals = this.model.normals.map(normal => { return normal.data[nk]; });
      let classvals = this.model.classifiers.map(classifier => { return classifier[ck]; });
      let normvals : DataRange[] = [];
      
      for(let normval of normalvals) {
        let found = false;
        for(let nval of normvals) {
          if(JSON.stringify(normval) == JSON.stringify(nval)) {
            found = true;
            break;
          }
        }
        if(!found) normvals.push(normval);
      }

      for(let nval of normvals) {
        let nv = `${nval.low}to${nval.high}`;
        matrix[nk][ck][nv] = {} as Matrix;
        
        for(let cval of classvals) {
          let cv = Outcome[cval];
          matrix[nk][ck][nv][cv] = 0;

          for(let dat of data) {
            if(JSON.stringify(dat.normal.data[nk]) == JSON.stringify(nval) && dat.classifier[ck] == cval) matrix[nk][ck][nv][cv]++;
          }
        }
      }
    }
    // console.log('...normal occurrances calculated');
    return matrix;
  }

  private classOccurrance(classkey : string, data : DecisionData[]) : Matrix { // Class Occurrance Matrix keys = [ck][cv]
    // console.log('Calculating classifier occurrances...');
    let matrix : Matrix = {} as Matrix;
    let ck = classkey;
    let classvals = this.model.classifiers.map(classifier => { return classifier[ck]; });
    matrix[ck] = {} as Matrix;

    for(let cval of classvals) {
      let cv = Outcome[cval];
      matrix[ck][cv] = 0;

      for(let dat of data) {
        if(dat.classifier[ck] == cval) matrix[ck][cv]++;
      }
    }
    // console.log('...classifier occurrances calculated');
    return matrix;
  }

  private normalEntropy(classkey : string, occurrance : Matrix) : Matrix { // Normal Entropy Matrix keys = [nk][ck][nv]
    // console.log('Calculating normal entropies...');
    let matrix : Matrix = {} as Matrix;
    let normalkeys = Object.keys(this.model.normals[0].data);
    let ck = classkey;

    for(let nk of normalkeys) {
      matrix[nk] = { [ck]: {} as Matrix } as Matrix;
      let normalvals = this.model.normals.map(normal => { return normal.data[nk]; });
      let classvals = this.model.classifiers.map(classifier => { return classifier[ck]; });
      let normvals : DataRange[] = [];
      
      for(let normval of normalvals) {
        let found = false;
        for(let nval of normvals) {
          if(JSON.stringify(normval) == JSON.stringify(nval)) {
            found = true;
            break;
          }
        }
        if(!found) normvals.push(normval);
      }
      
      for(let nval of normvals) {
        let nv = `${nval.low}to${nval.high}`;
        matrix[nk][ck][nv] = 0
        let total = 0;
        
        for(let cval of classvals) {
          let cv = Outcome[cval];
          total += occurrance[nk][ck][nv][cv];            
        }

        if(total > 0) for(let cval of classvals) {
          let cv = Outcome[cval];
          let fraction = occurrance[nk][ck][nv][cv] / total;
          if(fraction > 0) matrix[nk][ck][nv] -= Math.log10(fraction) / Math.log10(classvals.length);
        }
      }
    }
    // console.log('...normal entropies calculated');
    return matrix;
  }

  private classEntropy(classkey : string, occurrance : Matrix) : Matrix { // Class Entropy Matrix keys = [ck]
    // console.log('Calculated classifier entropies...');
    let matrix : Matrix = {} as Matrix;
    let ck = classkey;
    let classvals = this.model.classifiers.map(classifier => { return classifier[ck]; });
    let total = 0;
    matrix[ck] = 0;

    for(let cval of classvals) {
      let cv = Outcome[cval];
      total += occurrance[ck][cv];
    }

    if(total > 0) for(let cval of classvals) {
      let cv = Outcome[cval];
      let fraction = occurrance[ck][cv] / total;
      if(fraction > 0) matrix[ck] -= Math.log10(fraction) / Math.log10(classvals.length);
      else matrix[ck] = 0;
    }
    // console.log('...classifier entropies calculated');
    return matrix;
  }

  private normalInfogain(classkey : string, occurrance : Matrix, entropy : Matrix) : Matrix { // Normal Infogain Matrix keys = [nk][ck][nkey][nv]
    // console.log('Calculating normal information gains...');
    let matrix : Matrix = {} as Matrix;
    let normalkeys = Object.keys(this.model.normals[0].data);
    let ck = classkey;

    for(let nk of normalkeys) {
      matrix[nk] = { [ck]: {} as Matrix } as Matrix;
      let normalvals = this.model.normals.map(normal => { return normal.data[nk]; });
      let classvals = this.model.classifiers.map(classifier => { return classifier[ck]; });
      let normvals : DataRange[] = [];
      
      for(let normval of normalvals) {
        let found = false;
        for(let nval of normvals) {
          if(JSON.stringify(normval) == JSON.stringify(nval)) {
            found = true;
            break;
          }
        }
        if(!found) normvals.push(normval);
      }

      let totalocc = 0;
      let totalent = 0;

      for(let nval of normvals) {
        let nv = `${nval.low}to${nval.high}`;
        
        for(let cval of classvals) {
          let cv = Outcome[cval];
          totalocc += occurrance[nk][ck][nv][cv];            
        }
      }

      if(totalocc > 0) for(let nval of normvals) {
        let nv = `${nval.low}to${nval.high}`;
        
        for(let cval of classvals) {
          let cv = Outcome[cval];
          totalent += (occurrance[nk][ck][nv][cv] / totalocc) * entropy[nk][ck][nv];            
        }
      }

      for(let nkey of normalkeys) {
        matrix[nk][ck][nkey] = {} as Matrix;

        for(let nval of normvals) {
          let nv = `${nval.low}to${nval.high}`;

          if(nk == nkey) matrix[nk][ck][nkey][nv] = null;
          else matrix[nk][ck][nkey][nv] = entropy[nkey][ck][nv] - totalent;
        }
      }
    }
    // console.log('...normal information gains calculated');
    return matrix;
  }

  private classInfogain(classkey : string, normaloccurrance : Matrix, classentropy : Matrix, normalentropy : Matrix) : Matrix { // Class Infogain Matrix keys = [nk][ck]
    // console.log('Calculating classifier information gain...');
    let matrix : Matrix = {} as Matrix;
    let normalkeys = Object.keys(this.model.normals[0].data);
    let ck = classkey;
    
    for(let nk of normalkeys) {
      matrix[nk] = {} as Matrix;
      let normalvals = this.model.normals.map(normal => { return normal.data[nk]; });
      let normvals : DataRange[] = [];
      
      for(let normval of normalvals) {
        let found = false;
        for(let nval of normvals) {
          if(JSON.stringify(normval) == JSON.stringify(nval)) {
            found = true;
            break;
          }
        }
        if(!found) normvals.push(normval);
      }
      
      matrix[nk][ck] = {} as Matrix;
      let classvals = this.model.classifiers.map(classifier => { return classifier[ck]; });
      let totalocc = 0;
      let totalent = 0;

      for(let nval of normvals) {
        let nv = `${nval.low}to${nval.high}`;
        
        for(let cval of classvals) {
          let cv = Outcome[cval];
          totalocc += normaloccurrance[nk][ck][nv][cv];            
        }
      }

      if(totalocc > 0) for(let nval of normvals) {
        let nv = `${nval.low}to${nval.high}`;
        
        for(let cval of classvals) {
          let cv = Outcome[cval];
          totalent += (normaloccurrance[nk][ck][nv][cv] / totalocc) * normalentropy[nk][ck][nv];            
        }
      }

      if(classentropy[ck] > totalent) matrix[nk][ck] = classentropy[ck] - totalent;
      else matrix[nk][ck] = 0;
    }
    // console.log('...classifier information gain calculated');
    return matrix;
  }
  
  private build(samples : Samples) : DecisionModel {
    console.log('Building decision model...');
    let matrix : Matrix = {} as Matrix;
    let normalkeys = Object.keys(this.model.normals[0].data);
    let classkeys = Object.keys(this.model.classifiers[0]);
    for(let ck of classkeys) {
      console.log('Building decision matrix for classifier', ck + '...');
      let coccurrance = this.classOccurrance(ck, samples.training);
      let centropy = this.classEntropy(ck, coccurrance);
      let noccurrance = this.normalOccurrance(ck, samples.training);
      let nentropy = this.normalEntropy(ck, noccurrance);
      let infogain = this.classInfogain(ck, noccurrance, centropy, nentropy);
      let rk = normalkeys[0];
      for(let nk of normalkeys) if(infogain[nk][ck] > infogain[rk][ck]) rk = nk;
      let decisionmatrix : DecisionMatrix = {} as DecisionMatrix;
      let normalvals = samples.training.map(train => { return train.normal.data[rk]; });
      let normvals : DataRange[] = [];
      
      for(let normval of normalvals) {
        let found = false;
        for(let nval of normvals) {
          if(JSON.stringify(normval) == JSON.stringify(nval)) {
            found = true;
            break;
          }
        }
        if(!found) normvals.push(normval);
      }

      let predictions : DecisionMatrix[] = [];
      console.log('root:', rk);
      for(let nv of normvals) {
        let path = this.path(rk, ck, nv, samples.training);
        let keys = Object.keys(path);
        let values = Object.values(path);
        predictions.push({ value: nv, [keys[0]]: values[0] });
      }
      decisionmatrix[rk] = predictions;
      matrix[ck] = decisionmatrix;
      console.log('...decision matrix for classifier', ck, 'built');
    }
    this.model.matrix = matrix;
    this.model.timestamp = new Date(Date.now());
    console.log(JSON.stringify(this.model));
    console.log('...decision model built');
    return this.model;
  }
  
  private path(normalkey : string, classkey : string, normalval : DataRange, data : DecisionData[]) : { [key : string] : DecisionMatrix[] | Outcome } {
    let nk = normalkey;
    let ck = classkey;
    let nv = `${normalval.low}to${normalval.high}`;
    let dat = this.filterData(nk, normalval, data);
    let classvals = dat.map(d => { return d.classifier[ck]; });
    let occurrance = this.normalOccurrance(ck, dat);
    let entropy = this.normalEntropy(ck, occurrance);
    if(dat.length == data.length) {
      let oc = 0;
      let size = 0;
      for(let cval of classvals) {
        let cv = Outcome[cval];
        for(let i = 0; i < occurrance[nk][ck][nv][cv]; i++) {
          if(cval > 0) {
            oc += cval;
            size++;
          }
          else if(cval < 0) {
            oc += cval;
            size--;
          }
        }
      }
      oc = (size == 0 ? oc : oc / Math.abs(size));
      oc = (oc < -2.5 || (oc < -1.5 && oc > -2) || (oc < -0.5 && oc > -1) ? Math.floor(oc) : Math.round(oc));
      oc = (oc > 3 ? 3 : (oc < -3 ? -3 : (oc == 0 ? 0 : oc)));
      console.log('  leaf oc:', oc);
      return { outcome: oc };
    }
    else if(entropy[nk][ck][nv] <= 0) {
      let classvals = dat.map(d => { return d.classifier[ck]; });
      let classval = classvals[0];
      for(let clsval of classvals) {
        let cv = Outcome[classval];
        let cval = Outcome[clsval];
        if(occurrance[nk][ck][nv][cval] > occurrance[nk][ck][nv][cv]) classval = clsval;
      }
      console.log('  leaf cv:', classval);
      return { outcome: classval };
    }
    else {
      let infogain = this.normalInfogain(ck, occurrance, entropy);
      let normalkeys = Object.keys(this.model.normals[0].data);
      let nkey = normalkeys[0];
      for(let normalkey of normalkeys)
        if(infogain[nkey][ck][nk][nv] == null || infogain[normalkey][ck][nk][nv] > infogain[nkey][ck][nk][nv]) nkey = normalkey;
      let normalvals = dat.map(d => { return d.normal.data[nkey] });
      let normvals : DataRange[] = [];
      
      for(let normval of normalvals) {
        let found = false;
        for(let nval of normvals) {
          if(JSON.stringify(normval) == JSON.stringify(nval)) {
            found = true;
            break;
          }
        }
        if(!found) normvals.push(normval);
      }

      let predictions : DecisionMatrix[] = [];
      for(let nval of normvals) {
        console.log(' node:', nkey, '-', nval);
        let path = this.path(nkey, ck, nval, dat);
        let keys = Object.keys(path);
        let values = Object.values(path);
        predictions.push({ value: nval, [keys[0]]: values[0] });
      }
      return { [nkey] : predictions };
    }
  }

  private filterData(normalkey : string, normalval : DataRange, data : DecisionData[]) : DecisionData[] {
    // console.log('Filtering data...');
    let nk = normalkey;
    let nv = normalval;
    let d : DecisionData[] = [];
    data.forEach(dat => { if(JSON.stringify(dat.normal.data[nk]) == JSON.stringify(nv)) d.push(dat); });
    // console.log('...data filtered');
    return d;
  }
  
  public async predict(symbol : string, data : DecisionData) : Promise<Classifier> {
    if(!this.model.matrix) {
      let r : SuccessResponse | RejectResponse | ErrorResponse = await this.load(symbol).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) throw new Error('Could not load decision matrix for ' + symbol);
      else {
        this.model = (r as SuccessResponse).data;
        if(!this.model) throw new Error('Could not load decision matrix for ' + symbol);
      }
    }
    let classifier = {} as Classifier;
    let classkeys = Object.keys(this.model.matrix);
    for(let ck of classkeys) {
      console.log();
      classifier[ck] = this.p(this.model.matrix[ck], data);
      console.log();
    }
    return classifier;
  }

  private p(matrix : any, data : DecisionData, key? : string) : Outcome {
    let nkeys = Object.keys(data.normal.data);
    if(key) {
      if(key == 'outcome') { console.log('outcome:', matrix[key]); return matrix[key]; }
      else if(nkeys.includes(key)) {
        for(let m of matrix) {
          if(m.value && JSON.stringify(m.value) == JSON.stringify(data.normal.data[key])) return this.p(m, data);
        }
      }
    }
    else if(matrix instanceof Object) {
      let keys = Object.keys(matrix);
      for(let k of keys) {
        if(nkeys.includes(k)) return this.p(matrix[k], data, k);
        else if(k == 'outcome') {
          return matrix[k];
        }
      }
    }
    let oc = 0;
    let size = 0;
    for(let m of matrix) {
      let ks = Object.keys(m);
      for(let k of ks) {
        if(k == 'outcome') {
          oc += m[k];
          size++;
        }
      }
    }
    oc = (size > 0 ? oc / size : 0);
    oc = (oc < -2.5 || (oc < -1.5 && oc > -2) || (oc < -0.5 && oc > -1) ? Math.floor(oc) : Math.round(oc));
    oc = (oc == 0 ? 0 : oc);
    return oc;
  }

  public suggest(classifier : Classifier) : Suggestion {
    let verypositive = Outcome.VeryPositive + Outcome.VeryPositive * 1.3 + Outcome.VeryPositive * 1.9;
    let positive = Outcome.Positive + Outcome.Positive * 1.3 + Outcome.Positive * 1.9;
    let neutral = 0;
    let negative = Outcome.Positive + Outcome.Positive * 1.3 + Outcome.Positive * 1.9;
    let verynegative = Outcome.VeryNegative + Outcome.VeryNegative * 1.3 + Outcome.VeryNegative * 1.9;
    let score = classifier.dailyoutcome + classifier.weeklyoutcome * 1.3 + classifier.monthlyoutcome * 1.9;
    let suggestion : Suggestion = {} as Suggestion;

    if(score > verypositive)                     suggestion = Suggestion.StrongBuy;
    else if(score > positive)                    suggestion = Suggestion.Buy;
    else if(score > neutral || score > negative) suggestion = Suggestion.Hold;
    else if(score > verynegative)                suggestion = Suggestion.Sell;
    else                                         suggestion = Suggestion.StrongSell;

    console.log('suggestion:', suggestion);
    return suggestion;
  }

  public async validate(symbol : string) : Promise<Confidence> {
    this.model.validity = {} as Confidence;

    let dailycorrect = 0;
    let weeklycorrect = 0;
    let monthlycorrect = 0;
    let suggestcorrect = 0;
    let total = this.model.valids.length;
    
    for(let valid of this.model.valids) {
      let d = 0;
      let w = 0;
      let m = 0;
      let r : SuccessResponse | RejectResponse | ErrorResponse = await this.predict(symbol, valid).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) continue;
      else {
        let classifier : Classifier = (r as SuccessResponse).data;
        if(classifier) {
          // console.log();
          // console.log('----------');

          // console.log('actual dailyoutcome:', valid.classifier.dailyoutcome);
          // console.log('predict dailyoutcome:', classifier.dailyoutcome);
          // if(valid.classifier.dailyoutcome == classifier.dailyoutcome) console.log('dailyoutcome +- 0');
          // else if(valid.classifier.dailyoutcome == classifier.dailyoutcome + 1 || valid.classifier.dailyoutcome == classifier.dailyoutcome - 1) console.log('dailyoutcome +- 1');
          // else if(valid.classifier.dailyoutcome == classifier.dailyoutcome + 2 || valid.classifier.dailyoutcome == classifier.dailyoutcome - 2) console.log('dailyoutcome +- 2');
          // else console.log('daily > +- 2');
          
          // console.log()

          // console.log('actual weeklyoutcome:', valid.classifier.weeklyoutcome);
          // console.log('predict weeklyoutcome:', classifier.weeklyoutcome);
          // if(valid.classifier.weeklyoutcome == classifier.weeklyoutcome) console.log('weeklyoutcome +- 0');
          // else if(valid.classifier.weeklyoutcome == classifier.weeklyoutcome + 1 || valid.classifier.weeklyoutcome == classifier.weeklyoutcome - 1) console.log('weeklyoutcome +- 1');
          // else if(valid.classifier.weeklyoutcome == classifier.weeklyoutcome + 2 || valid.classifier.weeklyoutcome == classifier.weeklyoutcome - 2) console.log('weeklyoutcome +- 2');
          // else console.log('weekly > +- 2');

          // console.log();

          // console.log('actual monthlyoutcome:', valid.classifier.monthlyoutcome);
          // console.log('predict monthlyoutcome:', classifier.monthlyoutcome);
          // if(valid.classifier.monthlyoutcome == classifier.monthlyoutcome) console.log('monthlyoutcome +- 0');
          // else if(valid.classifier.monthlyoutcome == classifier.monthlyoutcome + 1 || valid.classifier.monthlyoutcome == classifier.monthlyoutcome - 1) console.log('monthlyoutcome +- 1');
          // else if(valid.classifier.monthlyoutcome == classifier.monthlyoutcome + 2 || valid.classifier.monthlyoutcome == classifier.monthlyoutcome - 2) console.log('monthlyoutcome +- 2');
          // else console.log('monthly > +- 2');

          // console.log('----------');
          // console.log();

          if(valid.classifier.dailyoutcome == classifier.dailyoutcome) d = 1;
          else if(valid.classifier.dailyoutcome == classifier.dailyoutcome + 1 || valid.classifier.dailyoutcome == classifier.dailyoutcome - 1) d = 0.75;
          else if(valid.classifier.dailyoutcome == classifier.dailyoutcome + 2 || valid.classifier.dailyoutcome == classifier.dailyoutcome - 2) d = 0.25;
          
          if(valid.classifier.weeklyoutcome == classifier.weeklyoutcome) w = 1;
          else if(valid.classifier.weeklyoutcome == classifier.weeklyoutcome + 1 || valid.classifier.weeklyoutcome == classifier.weeklyoutcome - 1) w = 0.75;
          else if(valid.classifier.weeklyoutcome == classifier.weeklyoutcome + 2 || valid.classifier.weeklyoutcome == classifier.weeklyoutcome - 2) w = 0.25;

          if(valid.classifier.monthlyoutcome == classifier.monthlyoutcome) m = 1;
          else if(valid.classifier.monthlyoutcome == classifier.monthlyoutcome + 1 || valid.classifier.monthlyoutcome == classifier.monthlyoutcome - 1) m = 0.75;
          else if(valid.classifier.monthlyoutcome == classifier.monthlyoutcome + 2 || valid.classifier.monthlyoutcome == classifier.monthlyoutcome - 2) m = 0.25;
        }
        else continue;
      }

      dailycorrect += d;
      weeklycorrect += w;
      monthlycorrect += m;
      suggestcorrect += (d + w + m) / 3;
    };

    this.model.validity["dailyoutcome"] = dailycorrect / total;
    this.model.validity["weeklyoutcome"] = weeklycorrect / total;
    this.model.validity["monthlyoutcome"] = monthlycorrect / total;
    this.model.validity["suggestion"] = suggestcorrect / total;
    
    return this.model.validity;
  }
  
  public async test(symbol : string) : Promise<Confidence> {
    this.model.confidence = {} as Confidence;
    
    let dailycorrect = 0;
    let weeklycorrect = 0;
    let monthlycorrect = 0;
    let suggestcorrect = 0;
    let total = this.model.tests.length;
    
    for(let test of this.model.tests) {
      let d = 0;
      let w = 0;
      let m = 0;
      
      let r : SuccessResponse | RejectResponse | ErrorResponse = await this.predict(symbol, test).then(res => { return new SuccessResponse(res); }, rej => { console.error(rej); return new RejectResponse(rej); }).catch(err => { console.error(err); return new ErrorResponse(err); });
      if(r.error) continue;
      else {
        let classifier : Classifier = (r as SuccessResponse).data;
        if(classifier) {
          // console.log();
          // console.log('----------');

          // console.log('actual dailyoutcome:', test.classifier.dailyoutcome);
          // console.log('predict dailyoutcome:', classifier.dailyoutcome);
          // if(test.classifier.dailyoutcome == classifier.dailyoutcome) console.log('dailyoutcome +- 0');
          // else if(test.classifier.dailyoutcome == classifier.dailyoutcome + 1 || test.classifier.dailyoutcome == classifier.dailyoutcome - 1) console.log('dailyoutcome +- 1');
          // else if(test.classifier.dailyoutcome == classifier.dailyoutcome + 2 || test.classifier.dailyoutcome == classifier.dailyoutcome - 2) console.log('dailyoutcome +- 2');
          // else console.log('daily > +- 2');
          
          // console.log()

          // console.log('actual weeklyoutcome:', test.classifier.weeklyoutcome);
          // console.log('predict weeklyoutcome:', classifier.weeklyoutcome);
          // if(test.classifier.weeklyoutcome == classifier.weeklyoutcome) console.log('weeklyoutcome +- 0');
          // else if(test.classifier.weeklyoutcome == classifier.weeklyoutcome + 1 || test.classifier.weeklyoutcome == classifier.weeklyoutcome - 1) console.log('weeklyoutcome +- 1');
          // else if(test.classifier.weeklyoutcome == classifier.weeklyoutcome + 2 || test.classifier.weeklyoutcome == classifier.weeklyoutcome - 2) console.log('weeklyoutcome +- 2');
          // else console.log('weekly > +- 2');

          // console.log();

          // console.log('actual monthlyoutcome:', test.classifier.monthlyoutcome);
          // console.log('predict monthlyoutcome:', classifier.monthlyoutcome);
          // if(test.classifier.monthlyoutcome == classifier.monthlyoutcome) console.log('monthlyoutcome +- 0');
          // else if(test.classifier.monthlyoutcome == classifier.monthlyoutcome + 1 || test.classifier.monthlyoutcome == classifier.monthlyoutcome - 1) console.log('monthlyoutcome +- 1');
          // else if(test.classifier.monthlyoutcome == classifier.monthlyoutcome + 2 || test.classifier.monthlyoutcome == classifier.monthlyoutcome - 2) console.log('monthlyoutcome +- 2');
          // else console.log('monthly > +- 2');

          // console.log('----------');
          // console.log();

          if(test.classifier.dailyoutcome == classifier.dailyoutcome) d = 1;
          else if(test.classifier.dailyoutcome == classifier.dailyoutcome + 1 || test.classifier.dailyoutcome == classifier.dailyoutcome - 1) d = 0.75;
          else if(test.classifier.dailyoutcome == classifier.dailyoutcome + 2 || test.classifier.dailyoutcome == classifier.dailyoutcome - 2) d = 0.25;
          
          if(test.classifier.weeklyoutcome == classifier.weeklyoutcome) w = 1;
          else if(test.classifier.weeklyoutcome == classifier.weeklyoutcome + 1 || test.classifier.weeklyoutcome == classifier.weeklyoutcome - 1) w = 0.75;
          else if(test.classifier.weeklyoutcome == classifier.weeklyoutcome + 2 || test.classifier.weeklyoutcome == classifier.weeklyoutcome - 2) w = 0.25;

          if(test.classifier.monthlyoutcome == classifier.monthlyoutcome) m = 1;
          else if(test.classifier.monthlyoutcome == classifier.monthlyoutcome + 1 || test.classifier.monthlyoutcome == classifier.monthlyoutcome - 1) m = 0.75;
          else if(test.classifier.monthlyoutcome == classifier.monthlyoutcome + 2 || test.classifier.monthlyoutcome == classifier.monthlyoutcome - 2) m = 0.25;
        }
        else continue;
      }

      dailycorrect += d;
      weeklycorrect += w;
      monthlycorrect += m;
      suggestcorrect += (d + w + m) / 3;
    }

    this.model.confidence["dailyoutcome"] = dailycorrect / total;
    this.model.confidence["weeklyoutcome"] = weeklycorrect / total;
    this.model.confidence["monthlyoutcome"] = monthlycorrect / total;
    this.model.confidence["suggestion"] = suggestcorrect / total;
    
    return this.model.confidence;
  }
}