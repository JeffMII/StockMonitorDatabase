import { DecisionModel } from "./predict.types";

export interface Stats {
  adjusted : number,
  dividend : number,
  open : number,
  high : number,
  low : number,
  close : number,
  volume : number,
}
export interface MACD {
  value : number,
  signal : number,
  history : number
}

export interface Series<T> {
  open : T,
  high : T,
  low : T,
  close : T
}

export interface Analysis {
  obv : number,
  ad : number,
  adx : number,
  macd : Series<MACD>,
  sma : Series<number>,
  ema : Series<number>,
  rsi : Series<number>,
  aroon : { up: number, down: number }
}

export interface Day {
  timestamp : Date,
  stats : Stats,
  analysis : Analysis
}

export interface Week {
  timestamp : Date,
  stats : Stats,
  analysis : Analysis,
}

export interface Month {
  timestamp : Date,
  stats : Stats,
  analysis : Analysis,
}

export interface Meta {
  symbol : string,
  name : string,
  exchange : string,
  type : string,
  ipo : Date,
}

export interface Stock {
  meta : Meta,
  months : Month[],
  weeks : Week[],
  days : Day[],
  model : DecisionModel
}