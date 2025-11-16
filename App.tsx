import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { CHART_IMAGE_BASE64 } from './constants';
import { AnalysisResult, Recommendation } from './types';

const RecommendationPill: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
  const baseClasses = "px-4 py-2 text-2xl font-bold text-white rounded-full shadow-lg";
  const colorClasses = {
    [Recommendation.BUY]: "bg-green-600 hover:bg-green-700",
    [Recommendation.SELL]: "bg-red-600 hover:bg-red-700",
    [Recommendation.HOLD]: "bg-gray-600 hover:bg-gray-700",
  };
  return (
    <div className={`${baseClasses} ${colorClasses[recommendation]}`}>
      {recommendation}
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full" aria-label="Loading analysis">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-300">Analyzing Chart...</p>
    </div>
);

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const imagePart = {
          inlineData: {
            mimeType: 'image/png',
            data: CHART_IMAGE_BASE64,
          },
        };

        const prompt = `You are an expert financial analyst specializing in technical analysis of trading charts. Your task is to analyze the provided chart image of Gold Spot / U.S. Dollar (XAUUSD) on a weekly timeframe and determine whether to BUY, SELL, or HOLD the asset.

Provide your analysis in a structured JSON format. The JSON object must contain the following fields:
1. "recommendation": A string, which must be one of "BUY", "SELL", or "HOLD".
2. "confidence": A number between 0 and 100 representing your confidence in the recommendation.
3. "reasoning": An array of strings, where each string is a clear, concise point explaining the technical reasons for your recommendation (e.g., "The chart shows a strong bullish trend with higher highs and higher lows," "Price has broken a key resistance level, suggesting further upside," "The recent pullback found support at the demand zone.").

Analyze the image and provide only the JSON object in your response.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, {text: prompt}] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendation: { type: Type.STRING, enum: [Recommendation.BUY, Recommendation.SELL, Recommendation.HOLD] },
                        confidence: { type: Type.NUMBER, description: 'A number between 0 and 100.' },
                        reasoning: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['recommendation', 'confidence', 'reasoning']
                }
            }
        });
        
        const resultText = response.text.trim();
        const resultJson = JSON.parse(resultText) as AnalysisResult;
        setAnalysis(resultJson);

      } catch (e) {
        console.error(e);
        setError("Failed to analyze the chart. Please check the API key and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            AI Trading Chart Analyst
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Gemini-powered technical analysis of XAU/USD.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-4 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-center">XAU/USD - 1 Week Chart</h2>
            <img 
              src={`data:image/png;base64,${CHART_IMAGE_BASE64}`} 
              alt="Trading chart for Gold vs US Dollar"
              className="w-full h-auto rounded-lg"
            />
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl flex flex-col">
             <h2 className="text-2xl font-bold mb-4 text-center">Analysis Result</h2>
            {isLoading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="text-red-400 text-center bg-red-900/50 p-4 rounded-lg">{error}</div>
            ) : analysis && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <RecommendationPill recommendation={analysis.recommendation} />
                
                <div className="w-full text-center">
                    <p className="text-xl text-gray-300">Confidence</p>
                    <p className="text-5xl font-bold text-blue-400">{analysis.confidence.toFixed(0)}%</p>
                </div>

                <div className="w-full pt-4 border-t border-gray-700">
                  <h3 className="text-xl font-semibold mb-3 text-center">Reasoning</h3>
                  <ul className="space-y-2 text-gray-300 list-disc list-inside">
                    {analysis.reasoning.map((reason, index) => (
                      <li key={index} className="text-base">{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Disclaimer: This is an AI-generated analysis and not financial advice. Always do your own research.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
