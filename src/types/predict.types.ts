export interface Matrix {
  [key : string ] : any
}

export enum Suggestion {
  StrongBuy = 2,
  Buy = 1,
  Hold = 0,
  Sell = -1,
  StrongSell = -2
}

export interface Stamps {
  dailytimestamp : Date,
  weeklytimestamp : Date,
  monthlytimestamp : Date,
  [key : string] : Date
}

export interface PreparedData {
  dailyadjusted : number,
  dailydividend : number,
  dailysplit : number,
  dailyopen : number,
  dailyhigh : number,
  dailylow : number,
  dailyclose : number,
  dailyvolume : number,
  dailyobv : number,
  dailyad : number,
  dailyadx : number,
  dailymacdopenvalue : number,
  dailymacdhighvalue : number,
  dailymacdlowvalue : number,
  dailymacdclosevalue : number,
  dailymacdopenhistory : number,
  dailymacdhighhistory : number,
  dailymacdlowhistory : number,
  dailymacdclosehistory : number,
  dailymacdopensignal : number,
  dailymacdhighsignal : number,
  dailymacdlowsignal : number,
  dailymacdclosesignal : number,
  dailysmaopen : number,
  dailysmahigh : number,
  dailysmalow : number,
  dailysmaclose : number,
  dailyemaopen : number,
  dailyemahigh : number,
  dailyemalow : number,
  dailyemaclose : number,
  dailyrsiopen : number,
  dailyrsihigh : number,
  dailyrsilow : number,
  dailyrsiclose : number,
  dailyaroonup : number,
  dailyaroondown : number,
  
  weeklyadjusted : number,
  weeklydividend : number,
  weeklysplit : number,
  weeklyopen : number,
  weeklyhigh : number,
  weeklylow : number,
  weeklyclose : number,
  weeklyvolume : number,
  weeklyobv : number,
  weeklyad : number,
  weeklyadx : number,
  weeklymacdopenvalue : number,
  weeklymacdhighvalue : number,
  weeklymacdlowvalue : number,
  weeklymacdclosevalue : number,
  weeklymacdopenhistory : number,
  weeklymacdhighhistory : number,
  weeklymacdlowhistory : number,
  weeklymacdclosehistory : number,
  weeklymacdopensignal : number,
  weeklymacdhighsignal : number,
  weeklymacdlowsignal : number,
  weeklymacdclosesignal : number,
  weeklysmaopen : number,
  weeklysmahigh : number,
  weeklysmalow : number,
  weeklysmaclose : number,
  weeklyemaopen : number,
  weeklyemahigh : number,
  weeklyemalow : number,
  weeklyemaclose : number,
  weeklyrsiopen : number,
  weeklyrsihigh : number,
  weeklyrsilow : number,
  weeklyrsiclose : number,
  weeklyaroonup : number,
  weeklyaroondown : number,

  monthlyadjusted : number,
  monthlydividend : number,
  monthlysplit : number,
  monthlyopen : number,
  monthlyhigh : number,
  monthlylow : number,
  monthlyclose : number,
  monthlyvolume : number,
  monthlyobv : number,
  monthlyad : number,
  monthlyadx : number,
  monthlymacdopenvalue : number,
  monthlymacdhighvalue : number,
  monthlymacdlowvalue : number,
  monthlymacdclosevalue : number,
  monthlymacdopenhistory : number,
  monthlymacdhighhistory : number,
  monthlymacdlowhistory : number,
  monthlymacdclosehistory : number,
  monthlymacdopensignal : number,
  monthlymacdhighsignal : number,
  monthlymacdlowsignal : number,
  monthlymacdclosesignal : number,
  monthlysmaopen : number,
  monthlysmahigh : number,
  monthlysmalow : number,
  monthlysmaclose : number,
  monthlyemaopen : number,
  monthlyemahigh : number,
  monthlyemalow : number,
  monthlyemaclose : number,
  monthlyrsiopen : number,
  monthlyrsihigh : number,
  monthlyrsilow : number,
  monthlyrsiclose : number,
  monthlyaroonup : number,
  monthlyaroondown : number,
  
  [key : string] : number,
}

export interface Prepared {
  data : PreparedData,
  stamps : Stamps
}

export enum Outcome {
  MostPositive = 3,
  VeryPositive = 2,
  Positive = 1,
  Neutral = 0,
  Negative = -1,
  VeryNegative = -2,
  MostNegative = -3
}

export interface DataRange {
  low: number,
  high: number
}

export interface NormalData {
  dailyadjusted : DataRange,
  dailydividend : DataRange,
  dailysplit : DataRange,
  dailyopen : DataRange,
  dailyhigh : DataRange,
  dailylow : DataRange,
  dailyclose : DataRange,
  dailyvolume : DataRange,
  dailyobv : DataRange,
  dailyad : DataRange,
  dailyadx : DataRange,
  dailymacdopenvalue : DataRange,
  dailymacdhighvalue : DataRange,
  dailymacdlowvalue : DataRange,
  dailymacdclosevalue : DataRange,
  dailymacdopenhistory : DataRange,
  dailymacdhighhistory : DataRange,
  dailymacdlowhistory : DataRange,
  dailymacdclosehistory : DataRange,
  dailymacdopensignal : DataRange,
  dailymacdhighsignal : DataRange,
  dailymacdlowsignal : DataRange,
  dailymacdclosesignal : DataRange,
  dailysmaopen : DataRange,
  dailysmahigh : DataRange,
  dailysmalow : DataRange,
  dailysmaclose : DataRange,
  dailyemaopen : DataRange,
  dailyemahigh : DataRange,
  dailyemalow : DataRange,
  dailyemaclose : DataRange,
  dailyrsiopen : DataRange,
  dailyrsihigh : DataRange,
  dailyrsilow : DataRange,
  dailyrsiclose : DataRange,
  dailyaroonup : DataRange,
  dailyaroondown : DataRange,
  
  weeklyadjusted : DataRange,
  weeklydividend : DataRange,
  weeklysplit : DataRange,
  weeklyopen : DataRange,
  weeklyhigh : DataRange,
  weeklylow : DataRange,
  weeklyclose : DataRange,
  weeklyvolume : DataRange,
  weeklyobv : DataRange,
  weeklyad : DataRange,
  weeklyadx : DataRange,
  weeklymacdopenvalue : DataRange,
  weeklymacdhighvalue : DataRange,
  weeklymacdlowvalue : DataRange,
  weeklymacdclosevalue : DataRange,
  weeklymacdopenhistory : DataRange,
  weeklymacdhighhistory : DataRange,
  weeklymacdlowhistory : DataRange,
  weeklymacdclosehistory : DataRange,
  weeklymacdopensignal : DataRange,
  weeklymacdhighsignal : DataRange,
  weeklymacdlowsignal : DataRange,
  weeklymacdclosesignal : DataRange,
  weeklysmaopen : DataRange,
  weeklysmahigh : DataRange,
  weeklysmalow : DataRange,
  weeklysmaclose : DataRange,
  weeklyemaopen : DataRange,
  weeklyemahigh : DataRange,
  weeklyemalow : DataRange,
  weeklyemaclose : DataRange,
  weeklyrsiopen : DataRange,
  weeklyrsihigh : DataRange,
  weeklyrsilow : DataRange,
  weeklyrsiclose : DataRange,
  weeklyaroonup : DataRange,
  weeklyaroondown : DataRange,

  monthlyadjusted : DataRange,
  monthlydividend : DataRange,
  monthlysplit : DataRange,
  monthlyopen : DataRange,
  monthlyhigh : DataRange,
  monthlylow : DataRange,
  monthlyclose : DataRange,
  monthlyvolume : DataRange,
  monthlyobv : DataRange,
  monthlyad : DataRange,
  monthlyadx : DataRange,
  monthlymacdopenvalue : DataRange,
  monthlymacdhighvalue : DataRange,
  monthlymacdlowvalue : DataRange,
  monthlymacdclosevalue : DataRange,
  monthlymacdopenhistory : DataRange,
  monthlymacdhighhistory : DataRange,
  monthlymacdlowhistory : DataRange,
  monthlymacdclosehistory : DataRange,
  monthlymacdopensignal : DataRange,
  monthlymacdhighsignal : DataRange,
  monthlymacdlowsignal : DataRange,
  monthlymacdclosesignal : DataRange,
  monthlysmaopen : DataRange,
  monthlysmahigh : DataRange,
  monthlysmalow : DataRange,
  monthlysmaclose : DataRange,
  monthlyemaopen : DataRange,
  monthlyemahigh : DataRange,
  monthlyemalow : DataRange,
  monthlyemaclose : DataRange,
  monthlyrsiopen : DataRange,
  monthlyrsihigh : DataRange,
  monthlyrsilow : DataRange,
  monthlyrsiclose : DataRange,
  monthlyaroonup : DataRange,
  monthlyaroondown : DataRange,

  [key : string] : DataRange
}

export interface Normal {
  data : NormalData,
  stamps : Stamps,
  [key : string] : NormalData | Stamps
}

export interface Classifier {
  dailyoutcome : Outcome,
  weeklyoutcome : Outcome,
  monthlyoutcome : Outcome,
  [key : string] : Outcome
}

export interface InfogainModel {
  normal : Matrix,
  classifier : Matrix
}

export interface Confidence {
  [key : string] : number
}

export interface DecisionData {
  normal : Normal,
  classifier : Classifier
}

export interface Samples {
  training : DecisionData[],
  testing : DecisionData[],
  validating : DecisionData[]
}

export interface DecisionMatrix {
  [key : string] : DecisionMatrix[] | DataRange | Outcome
}

export interface DecisionModel {
  timestamp : Date,
  normals: Normal[],
  classifiers: Classifier[],
  validity : Confidence,
  confidence : Confidence,
  tests: DecisionData[],
  valids: DecisionData[],
  matrix : DecisionMatrix
}