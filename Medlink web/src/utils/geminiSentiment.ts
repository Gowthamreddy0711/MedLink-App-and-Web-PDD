export interface SentimentAnalysisResult {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  score: number;
}

export async function analyzeSentiment(reviewText: string): Promise<SentimentAnalysisResult> {
  if (!reviewText || !reviewText.trim()) {
    return { sentiment: "NEUTRAL", score: 50 };
  }

  try {
    const res = await fetch('/api/sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reviewText })
    });

    if (!res.ok) {
      console.error("Sentiment backend error:", await res.text());
      return { sentiment: "NEUTRAL", score: 50 };
    }

    const data = await res.json();
    return {
      sentiment: data.sentiment || "NEUTRAL",
      score: typeof data.score === 'number' ? data.score : 50
    };
  } catch (error) {
    console.error("Error analyzing sentiment with backend:", error);
    return { sentiment: "NEUTRAL", score: 50 };
  }
}
