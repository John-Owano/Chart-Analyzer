
export enum Recommendation {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
}

export interface AnalysisResult {
  recommendation: Recommendation;
  confidence: number;
  reasoning: string[];
}
