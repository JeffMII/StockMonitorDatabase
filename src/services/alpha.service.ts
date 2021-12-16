import axios, { AxiosResponse } from 'axios';
import { Environment as Env } from '../../env.dev';
import { Day, MACD, Month, Series, Stock, Week } from '../types/stock.types';

export interface MetaIn {
  symbol : string,
  name : string,
  exchange : string,
  type : string,
  ipo : Date
}

export interface StatsIn {
  timestamp : Date,
  open : number,
  high : number,
  low : number,
  close : number,
  volume : number,
  adjusted : number,
  dividend : number,
}

export interface AnalysisIn {
  timestamp : Date,
  obv? : number,
  ad? : number,
  adx? : number,
  cci? : number,
  macd? : Series<MACD>,
  sma? : Series<number>,
  ema? : Series<number>,
  rsi? : Series<number>,
  aroon? : { up: number, down: number }
}

export class AlphaVantageService {

  private static calls = 0;
  private static time : Promise<boolean> | undefined;
  private static timer = async () => {
    AlphaVantageService.time = new Promise(res => {
      setTimeout(() => {
        AlphaVantageService.calls = 0;
        res(true);
      }, 1000*65);
    });
  };
  
  constructor() {};
  
  private async doGet(url : string) : Promise<AxiosResponse> {
    if(AlphaVantageService.calls == 0) AlphaVantageService.timer();
    if(AlphaVantageService.calls < 5) AlphaVantageService.calls++;
    else {
      console.log('\nwaiting for call limit to refresh...');
      await AlphaVantageService.time?.then().catch();
      console.log('\n...call limit refreshed');
      AlphaVantageService.timer();
      AlphaVantageService.calls++;
    }
    url = Env.urls.alpha + url;
    url += '&apikey=' + Env.keys.alpha;
    console.log('url:', url);
    return axios.get(url);
  }

  public getStocksData() : Promise<AxiosResponse> {
    let url = '?function=LISTING_STATUS';
    return this.doGet(url);
  }

  public async getStockMetas() : Promise<MetaIn[]> {
    let result : any;
    let metas : MetaIn[] = [];

    await this.getStocksData().then(res => result = res).catch(err => console.error(err));

    if(result?.data) {
      let csv : string = result.data;
      let data : string[][] = [];
      csv.split('\r\n').forEach(row => { if(row.includes(',')) data.push(row.split(',')); });
      let labels : string[] | undefined = data.shift();
      
      if(labels) {
        data.forEach(d => {
          metas.push({
            symbol: d[labels!.indexOf('symbol')],
            name: d[labels!.indexOf('name')] ,
            exchange: d[labels!.indexOf('exchange')] ,
            type: d[labels!.indexOf('assetType')] ,
            ipo: new Date(d[labels!.indexOf('ipoDate')])
          });
        });
      }
    }
    return metas;
  }
  
  public async getDays(symbol : string) : Promise<Day[]> {
    let result : any;
    let days : Day[] = [];
    let stats : StatsIn[] = [];

    await this.getStats(symbol, 'daily', 'full').then(res => result = res).catch(err => console.error(err));
    if(result) stats = result;

    let analysis : AnalysisIn[] = [];

    await this.getAnalysis(symbol, 'daily').then(res => result = res).catch(err => console.error(err));
    if(result) analysis = result;

    let length = stats.length;
    if(analysis.length < length) length = analysis.length;

    for(let i = 0; i < length; i++) {
      days.push({
        timestamp: stats[i].timestamp,
        stats: {
          adjusted: stats[i].adjusted,
          dividend: stats[i].dividend,
          open: stats[i].open,
          high: stats[i].high,
          low: stats[i].low,
          close: stats[i].close,
          volume: stats[i].volume
        },
        analysis: {
          adx: analysis[i].adx!,
          ad: analysis[i].ad!,
          sma: analysis[i].sma!,
          ema: analysis[i].ema!,
          macd: analysis[i].macd!,
          aroon: analysis[i].aroon!,
          rsi: analysis[i].rsi!,
          obv: analysis[i].obv!
        }
      });
    }

    return days;
  }

  public async getWeeks(symbol : string) : Promise<Week[]> {
    let result : any;
    let weeks : Week[] = [];
    let stats : StatsIn[] = [];

    await this.getStats(symbol, 'weekly', 'full').then(res => result = res).catch(err => console.error(err));
    if(result) stats = result;

    let analysis : AnalysisIn[] = [];

    await this.getAnalysis(symbol, 'weekly').then(res => result = res).catch(err => console.error(err));
    if(result) analysis = result;

    let length = stats.length;
    if(analysis.length < length) length = analysis.length;

    for(let i = 0; i < length; i++) {
      weeks.push({
        timestamp: stats[i].timestamp,
        stats: {
          adjusted: stats[i].adjusted,
          dividend: stats[i].dividend,
          open: stats[i].open,
          high: stats[i].high,
          low: stats[i].low,
          close: stats[i].close,
          volume: stats[i].volume
        },
        analysis: {
          adx: analysis[i].adx!,
          ad: analysis[i].ad!,
          sma: analysis[i].sma!,
          ema: analysis[i].ema!,
          macd: analysis[i].macd!,
          aroon: analysis[i].aroon!,
          rsi: analysis[i].rsi!,
          obv: analysis[i].obv!
        }
      });
    }

    return weeks;
  }

  public async getMonths(symbol : string) : Promise<Month[]> {
    let result : any;
    let months : Month[] = [];
    let stats : StatsIn[] = [];

    await this.getStats(symbol, 'monthly', 'full').then(res => result = res).catch(err => console.error(err));
    if(result) stats = result;

    let analysis : AnalysisIn[] = [];

    await this.getAnalysis(symbol, 'monthly').then(res => result = res).catch(err => console.error(err));
    if(result) analysis = result;

    let length = stats.length;
    if(analysis.length < length) length = analysis.length;

    for(let i = 0; i < length; i++) {
      months.push({
        timestamp: stats[i].timestamp,
        stats: {
          adjusted: stats[i].adjusted,
          dividend: stats[i].dividend,
          open: stats[i].open,
          high: stats[i].high,
          low: stats[i].low,
          close: stats[i].close,
          volume: stats[i].volume
        },
        analysis: {
          adx: analysis[i].adx!,
          ad: analysis[i].ad!,
          sma: analysis[i].sma!,
          ema: analysis[i].ema!,
          macd: analysis[i].macd!,
          aroon: analysis[i].aroon!,
          rsi: analysis[i].rsi!,
          obv: analysis[i].obv!
        }
      });
    }

    return months;
  }

  public getStatsData(symbol : string, interval? : string, size? : string) : Promise<AxiosResponse> {
    let url = '?function=TIME_SERIES_DAILY_ADJUSTED';
    if(interval) {
      if(interval == 'weekly') url = '?function=TIME_SERIES_WEEKLY_ADJUSTED';
      else if(interval == 'monthly') url = '?function=TIME_SERIES_MONTHLY_ADJUSTED';
    }
    url += '&symbol=' + symbol + '&datatype=csv&outputsize=' + (size ? size : 'compact');
    return this.doGet(url);
  }

  public async getStats(symbol : string, interval? : string, size? : string) : Promise<StatsIn[]> {
    let result : any;
    let stats : StatsIn[] = [];

    await this.getStatsData(symbol, interval, size).then(res => result = res).catch(err => console.error(err));
    
    if(result?.data) {
      let csv : string = result.data;
      let data : string[][] = [];
      csv.split('\r\n').forEach(row => { if(row.includes(',')) data.push(row.split(',')); });
      
      let labels : string[] | undefined = data.shift();

      let t = labels!.indexOf('timestamp');
      let o = labels!.indexOf('open');
      let h = labels!.indexOf('high');
      let l = labels!.indexOf('low');
      let c = labels!.indexOf('close');
      let v = labels!.indexOf('volume');
      let ac = labels!.indexOf('adjusted_close');
      let da = labels!.indexOf('dividend_amount');
      
      if(labels) {
        data.forEach(d => {
          stats.push({
            timestamp: new Date(d[t]),
            open: Number.parseFloat(d[o]),
            high: Number.parseFloat(d[h]),
            low: Number.parseFloat(d[l]),
            close: Number.parseFloat(d[c]),
            volume: Number.parseInt(d[v]),
            adjusted: Number.parseInt(d[(ac == -1 ? labels!.indexOf('adjusted close') : ac)]),
            dividend: Number.parseInt(d[(da == -1 ? labels!.indexOf('dividend amount') : da)])
          });
        });
      }
    }
    return stats;
  }

  public async getAnalysis(symbol : string, interval : string) : Promise<AnalysisIn[]> {
    let result : any;
    
    let open : any;
    let high : any;
    let low : any;
    let close : any;

    await this.getADX(symbol, interval).then(res => result = res).catch(err => console.error(err));
    let adxs : AnalysisIn[] = this.adx(result.data);
    
    await this.getSMA(symbol, interval, 'open').then(res => open = res).catch(err => console.error(err));
    await this.getSMA(symbol, interval, 'high').then(res => high = res).catch(err => console.error(err));
    await this.getSMA(symbol, interval, 'low').then(res => low = res).catch(err => console.error(err));
    await this.getSMA(symbol, interval, 'close').then(res => close = res).catch(err => console.error(err));
    let smas : AnalysisIn[] = (open?.data && high?.data && low?.data && close?.data ? this.sma(open.data, high.data, low.data, close.data) : []);
    
    await this.getEMA(symbol, interval, 'open').then(res => open = res).catch(err => console.error(err));
    await this.getEMA(symbol, interval, 'high').then(res => high = res).catch(err => console.error(err));
    await this.getEMA(symbol, interval, 'low').then(res => low = res).catch(err => console.error(err));
    await this.getEMA(symbol, interval, 'close').then(res => close = res).catch(err => console.error(err));
    let emas : AnalysisIn[] = (open?.data && high?.data && low?.data && close?.data ? this.ema(open.data, high.data, low.data, close.data) : []);
    
    await this.getCCI(symbol, interval).then(res => result = res).catch(err => console.error(err));
    let ccis : AnalysisIn[] = this.cci(result.data);
    
    await this.getMACD(symbol, interval, 'open').then(res => open = res).catch(err => console.error(err));
    await this.getMACD(symbol, interval, 'high').then(res => high = res).catch(err => console.error(err));
    await this.getMACD(symbol, interval, 'low').then(res => low = res).catch(err => console.error(err));
    await this.getMACD(symbol, interval, 'close').then(res => close = res).catch(err => console.error(err));
    let macds : AnalysisIn[] = (open?.data && high?.data && low?.data && close?.data ? this.macd(open.data, high.data, low.data, close.data) : []);
    
    await this.getRSI(symbol, interval, 'open').then(res => open = res).catch(err => console.error(err));
    await this.getRSI(symbol, interval, 'high').then(res => high = res).catch(err => console.error(err));
    await this.getRSI(symbol, interval, 'low').then(res => low = res).catch(err => console.error(err));
    await this.getRSI(symbol, interval, 'close').then(res => close = res).catch(err => console.error(err));
    let rsis : AnalysisIn[] = (open?.data && high?.data && low?.data && close?.data ? this.rsi(open.data, high.data, low.data, close.data) : []);
    
    await this.getAROON(symbol, interval).then(res => result = res).catch(err => console.error(err));
    let aroons : AnalysisIn[] = this.aroon(result.data);
    
    await this.getAD(symbol, interval).then(res => result = res).catch(err => console.error(err));
    let ads : AnalysisIn[] = this.ad(result.data);
    
    await this.getOBV(symbol, interval).then(res => result = res).catch(err => console.error(err));
    let obvs : AnalysisIn[] = this.obv(result.data);
    
    let analysis : AnalysisIn[] = [];

    let length = adxs.length;
    if(smas.length < length) length = smas.length;
    if(emas.length < length) length = emas.length;
    if(ccis.length < length) length = ccis.length;
    if(macds.length < length) length = macds.length;
    if(rsis.length < length) length = rsis.length;
    if(aroons.length < length) length = aroons.length;
    if(ads.length < length) length = ads.length;
    if(obvs.length < length) length = obvs.length;

    for(let i = 0; i < length; i++) {
      analysis.push({
        timestamp: adxs[i].timestamp,
        adx: adxs[i].adx,
        sma: smas[i].sma,
        ema: emas[i].ema,
        cci: ccis[i].cci,
        macd: macds[i].macd,
        rsi: rsis[i].rsi,
        aroon: aroons[i].aroon,
        ad: ads[i].ad,
        obv: obvs[i].obv
      });
    }

    return analysis;
  }

  private adx(csv : string) {
    let data : string[][] = [];
    csv.split('\r\n').forEach(row => { if(row.includes(',')) data.push(row.split(',')); });
    console.log('csv data:', data);
    let labels : string[] | undefined = data.shift();
    
    let analysis : AnalysisIn[] = [];
    if(labels) {
      data.forEach(d => {
        analysis.push({
          timestamp: new Date(d[labels!.indexOf('time')]),
          adx: Number.parseFloat(d[labels!.indexOf('ADX')])
        });
      });
    }
    return analysis;
  }

  public getADX(symbol : string, interval : string) : Promise<AxiosResponse> {
    let url = '?function=ADX&symbol=' + symbol + '&interval=' + interval + '&time_period=10&datatype=csv';
    return this.doGet(url);
  }

  private sma(open : string, high : string, low : string, close : string) : AnalysisIn[] {
    let o : string[][] = [];
    let h : string[][] = [];
    let l : string[][] = [];
    let c : string[][] = [];

    open.split('\r\n').forEach(row => { if(row.includes(',')) o.push(row.split(',')); });
    high.split('\r\n').forEach(row => { if(row.includes(',')) h.push(row.split(',')); });
    low.split('\r\n').forEach(row => { if(row.includes(',')) l.push(row.split(',')); });
    close.split('\r\n').forEach(row => { if(row.includes(',')) c.push(row.split(',')); });
    
    let olabels = o.shift();
    let hlabels = h.shift();
    let llabels = l.shift();
    let clabels = c.shift();

    let timestamps : Date[] = [];
    let series : Series<number>[] = [];

    if(olabels) {
      o.forEach(data => {
        timestamps.push(new Date(data[olabels!.indexOf('time')]));
        series.push({ open: Number.parseFloat(data[olabels!.indexOf('SMA')]) } as Series<number>);
      });
    }

    if(hlabels) {
      h.forEach((data, i) => {
        series[i].high = Number.parseFloat(data[olabels!.indexOf('SMA')]);
      });
    }

    if(llabels) {
      l.forEach((data, i) => {
        series[i].low = Number.parseFloat(data[olabels!.indexOf('SMA')]);
      });
    }

    if(clabels) {
      c.forEach((data, i) => {
        series[i].close = Number.parseFloat(data[olabels!.indexOf('SMA')]);
      });
    }

    let analysis : AnalysisIn[] = [];

    if(timestamps.length > 0) {
      timestamps.forEach((time, i) => {
        analysis.push({ timestamp: time, sma: series[i] });
      });
    }

    return analysis;
  }

  public getSMA(symbol : string, interval : string, type : string) : Promise<AxiosResponse> {
    let url = '?function=SMA&symbol=' + symbol + '&interval=' + interval + '&time_period=10&series_type=' + type + '&datatype=csv';
    return this.doGet(url);
  }

  private ema(open : string, high : string, low : string, close : string) {
    let o : string[][] = [];
    let h : string[][] = [];
    let l : string[][] = [];
    let c : string[][] = [];

    open.split('\r\n').forEach(row => { if(row.includes(',')) o.push(row.split(',')); });
    high.split('\r\n').forEach(row => { if(row.includes(',')) h.push(row.split(',')); });
    low.split('\r\n').forEach(row => { if(row.includes(',')) l.push(row.split(',')); });
    close.split('\r\n').forEach(row => { if(row.includes(',')) c.push(row.split(',')); });

    let olabels = o.shift();
    let hlabels = h.shift();
    let llabels = l.shift();
    let clabels = c.shift();
    
    let timestamps : Date[] = [];
    let series : Series<number>[] = [];

    if(olabels) {
      o.forEach(data => {
        timestamps.push(new Date(data[olabels!.indexOf('time')]));
        series.push({ open: Number.parseFloat(data[olabels!.indexOf('EMA')]) } as Series<number>);
      });
    }

    if(hlabels) {
      h.forEach((data, i) => {
        series[i].high = Number.parseFloat(data[olabels!.indexOf('EMA')]);
      });
    }

    if(llabels) {
      l.forEach((data, i) => {
        series[i].low = Number.parseFloat(data[olabels!.indexOf('EMA')]);
      });
    }

    if(clabels) {
      c.forEach((data, i) => {
        series[i].close = Number.parseFloat(data[olabels!.indexOf('EMA')]);
      });
    }

    let analysis : AnalysisIn[] = [];

    if(timestamps.length > 0) {
      timestamps.forEach((time, i) => {
        analysis.push({ timestamp: time, ema: series[i] });
      });
    }

    return analysis;
  }

  public getEMA(symbol : string, interval : string, type : string) : Promise<AxiosResponse> {
    let url = '?function=EMA&symbol=' + symbol + '&interval=' + interval + '&time_period=10&series_type=' + type + '&datatype=csv';
    return this.doGet(url);
  }

  private cci(csv : string) : AnalysisIn[] {
    let data : string[][] = [];
    csv.split('\r\n').forEach(row => { if(row.includes(',')) data.push(row.split(',')); });
    
    let labels : string[] | undefined = data.shift();
    
    let analysis : AnalysisIn[] = [];
    if(labels) {
      data.forEach(d => {
        analysis.push({
          timestamp: new Date(d[labels!.indexOf('time')]),
          cci: Number.parseFloat(d[labels!.indexOf('CCI')])
        });
      });
    }
    return analysis;
  }

  public getCCI(symbol : string, interval : string) : Promise<AxiosResponse> {
    let url = '?function=CCI&symbol=' + symbol + '&interval=' + interval + '&time_period=10&datatype=csv';
    return this.doGet(url);
  }

  private macd(open : string, high : string, low : string, close : string) {
    let o : string[][] = [];
    let h : string[][] = [];
    let l : string[][] = [];
    let c : string[][] = [];

    open.split('\r\n').forEach(row => { if(row.includes(',')) o.push(row.split(',')); });
    high.split('\r\n').forEach(row => { if(row.includes(',')) h.push(row.split(',')); });
    low.split('\r\n').forEach(row => { if(row.includes(',')) l.push(row.split(',')); });
    close.split('\r\n').forEach(row => { if(row.includes(',')) c.push(row.split(',')); });
    
    let olabels = o.shift();
    let hlabels = h.shift();
    let llabels = l.shift();
    let clabels = c.shift();
    
    let timestamps : Date[] = [];
    let series : Series<MACD>[] = [];

    if(olabels) {
      o.forEach(data => {
        timestamps.push(new Date(data[olabels!.indexOf('time')]));
        series.push({ open: {
          value: Number.parseFloat(data[olabels!.indexOf('MACD')]),
          signal: Number.parseFloat(data[olabels!.indexOf('MACD_Signal')]),
          history: Number.parseFloat(data[olabels!.indexOf('MACD_Hist')])
        } } as Series<MACD>);
      });
    }

    if(hlabels) {
      h.forEach((data, i) => {
        series[i].high = {
          value: Number.parseFloat(data[olabels!.indexOf('MACD')]),
          signal: Number.parseFloat(data[olabels!.indexOf('MACD_Signal')]),
          history: Number.parseFloat(data[olabels!.indexOf('MACD_Hist')])
        };
      });
    }

    if(llabels) {
      l.forEach((data, i) => {
        series[i].low = {
          value: Number.parseFloat(data[olabels!.indexOf('MACD')]),
          signal: Number.parseFloat(data[olabels!.indexOf('MACD_Signal')]),
          history: Number.parseFloat(data[olabels!.indexOf('MACD_Hist')])
        };
      });
    }

    if(clabels) {
      c.forEach((data, i) => {
        series[i].close = {
          value: Number.parseFloat(data[olabels!.indexOf('MACD')]),
          signal: Number.parseFloat(data[olabels!.indexOf('MACD_Signal')]),
          history: Number.parseFloat(data[olabels!.indexOf('MACD_Hist')])
        };
      });
    }

    let analysis : AnalysisIn[] = [];

    if(timestamps.length > 0) {
      timestamps.forEach((time, i) => {
        analysis.push({ timestamp: time, macd: series[i] });
      });
    }

    return analysis;
  }

  public getMACD(symbol : string, interval : string, type : string) : Promise<AxiosResponse> {
    let url = '?function=MACD&symbol=' + symbol + '&interval=' + interval + '&series_type=' + type + '&datatype=csv';
    return this.doGet(url);
  }

  private rsi(open : string, high : string, low : string, close : string) {
    let o : string[][] = [];
    let h : string[][] = [];
    let l : string[][] = [];
    let c : string[][] = [];

    open.split('\r\n').forEach(row => { if(row.includes(',')) o.push(row.split(',')); });
    high.split('\r\n').forEach(row => { if(row.includes(',')) h.push(row.split(',')); });
    low.split('\r\n').forEach(row => { if(row.includes(',')) l.push(row.split(',')); });
    close.split('\r\n').forEach(row => { if(row.includes(',')) c.push(row.split(',')); });
    
    let olabels = o.shift();
    let hlabels = h.shift();
    let llabels = l.shift();
    let clabels = c.shift();

    let timestamps : Date[] = [];
    let series : Series<number>[] = [];

    if(olabels) {
      o.forEach(data => {
        timestamps.push(new Date(data[olabels!.indexOf('time')]));
        series.push({ open: Number.parseFloat(data[olabels!.indexOf('RSI')]) } as Series<number>);
      });
    }

    if(hlabels) {
      h.forEach((data, i) => {
        series[i].high = Number.parseFloat(data[olabels!.indexOf('RSI')]);
      });
    }

    if(llabels) {
      l.forEach((data, i) => {
        series[i].low = Number.parseFloat(data[olabels!.indexOf('RSI')]);
      });
    }

    if(clabels) {
      c.forEach((data, i) => {
        series[i].close = Number.parseFloat(data[olabels!.indexOf('RSI')]);
      });
    }

    let analysis : AnalysisIn[] = [];

    if(timestamps.length > 0) {
      timestamps.forEach((time, i) => {
        analysis.push({ timestamp: time, rsi: series[i] });
      });
    }

    return analysis;
  }

  public getRSI(symbol : string, interval : string, type : string) : Promise<AxiosResponse> {
    let url = '?function=RSI&symbol=' + symbol + '&interval=' + interval + '&time_period=10&series_type=' + type + '&datatype=csv';
    return this.doGet(url);
  }

  private aroon(csv : string) {
    let data : string[][] = [];
    csv.split('\r\n').forEach(row => { if(row.includes(',')) data.push(row.split(',')); });
    let labels : string[] | undefined = data.shift();
    
    let analysis : AnalysisIn[] = [];
    if(labels) {
      data.forEach(d => {
        analysis.push({
          timestamp: new Date(d[labels!.indexOf('time')]),
          aroon: { up: Number.parseFloat(d[labels!.indexOf('Aroon Up')]), down: Number.parseFloat(d[labels!.indexOf('Aroon Down')]) }
        });
      });
    }
    return analysis;
  }

  public getAROON(symbol : string, interval : string) : Promise<AxiosResponse> {
    let url = '?function=AROON&symbol=' + symbol + '&interval=' + interval + '&time_period=10&datatype=csv';
    return this.doGet(url);
  }

  private ad(csv : string) {
    let data : string[][] = [];
    csv.split('\r\n').forEach(row => { if(row.includes(',')) data.push(row.split(',')); });
    let labels : string[] | undefined = data.shift();
    
    let analysis : AnalysisIn[] = [];
    if(labels) {
      data.forEach(d => {
        analysis.push({
          timestamp: new Date(d[labels!.indexOf('time')]),
          ad: Number.parseFloat(d[labels!.indexOf('Chaikin A/D')])
        });
      });
    }
    return analysis;
  }

  public getAD(symbol : string, interval : string) : Promise<AxiosResponse> {
    let url = '?function=AD&symbol=' + symbol + '&interval=' + interval + '&datatype=csv';
    return this.doGet(url);
  }

  private obv(csv : string) {
    let data : string[][] = [];
    csv.split('\r\n').forEach(row => { if(row.includes(',')) data.push(row.split(',')); });
    
    let labels : string[] | undefined = data.shift();
    
    let analysis : AnalysisIn[] = [];
    if(labels) {
      data.forEach(d => {
        analysis.push({
          timestamp: new Date(d[labels!.indexOf('time')]),
          obv: Number.parseFloat(d[labels!.indexOf('OBV')])
        });
      });
    }
    return analysis;
  }

  public getOBV(symbol : string, interval : string) : Promise<AxiosResponse> {
    let url = '?function=OBV&symbol=' + symbol + '&interval=' + interval + '&datatype=csv';
    return this.doGet(url);
  }  
}