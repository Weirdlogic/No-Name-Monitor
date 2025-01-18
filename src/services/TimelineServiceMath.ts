// src/services/TimelineServiceMath.ts

interface DataPoint {
    timestamp: Date;
    value: number;
  }
  
  export class TimelineServiceMath {
    private static getLinearPredictions(dataPoints: DataPoint[]): number[] {
      const xValues = dataPoints.map(p => p.timestamp.getTime());
      const yValues = dataPoints.map(p => p.value);
      const n = dataPoints.length;
  
      const xMean = xValues.reduce((a, b) => a + b, 0) / n;
      const yMean = yValues.reduce((a, b) => a + b, 0) / n;
  
      const slope = xValues.reduce((sum, x, i) => 
        sum + (x - xMean) * (yValues[i] - yMean), 0
      ) / xValues.reduce((sum, x) => 
        sum + Math.pow(x - xMean, 2), 0
      );
  
      const intercept = yMean - slope * xMean;
      return xValues.map(x => slope * x + intercept);
    }
  
    public static calculateTrend(dataPoints: DataPoint[]): 'increasing' | 'decreasing' | 'stable' {
      if (dataPoints.length < 2) return 'stable';
  
      const n = dataPoints.length;
      const xValues = dataPoints.map(p => p.timestamp.getTime());
      const yValues = dataPoints.map(p => p.value);
  
      const xMean = xValues.reduce((a, b) => a + b, 0) / n;
      const yMean = yValues.reduce((a, b) => a + b, 0) / n;
  
      const slope = xValues.reduce((sum, x, i) => 
        sum + (x - xMean) * (yValues[i] - yMean), 0
      ) / xValues.reduce((sum, x) => 
        sum + Math.pow(x - xMean, 2), 0
      );
  
      const THRESHOLD = 0.1;
      if (Math.abs(slope) < THRESHOLD) return 'stable';
      return slope > 0 ? 'increasing' : 'decreasing';
    }
  
    public static calculateChangeRate(dataPoints: DataPoint[]): number {
      if (dataPoints.length < 2) return 0;
  
      const first = dataPoints[0];
      const last = dataPoints[dataPoints.length - 1];
      
      const timeDiff = (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 3600); // hours
      const valueDiff = last.value - first.value;
  
      return valueDiff / timeDiff; // change per hour
    }
  
    public static calculateConfidence(dataPoints: DataPoint[]): number {
      if (dataPoints.length < 3) return 0;
  
      // Calculate R-squared value
      const yValues = dataPoints.map(p => p.value);
      const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  
      // Total sum of squares
      const tss = yValues.reduce((sum, y) => 
        sum + Math.pow(y - yMean, 2), 0
      );
  
      // Residual sum of squares
      const predictions = this.getLinearPredictions(dataPoints);
      const rss = yValues.reduce((sum, y, i) => 
        sum + Math.pow(y - predictions[i], 2), 0
      );
  
      // R-squared value
      return 1 - (rss / tss);
    }
  
    public static calculateMovingAverage(dataPoints: DataPoint[], windowSize: number): DataPoint[] {
      if (dataPoints.length < windowSize) return dataPoints;
  
      const result: DataPoint[] = [];
      for (let i = 0; i <= dataPoints.length - windowSize; i++) {
        const window = dataPoints.slice(i, i + windowSize);
        const sum = window.reduce((acc, point) => acc + point.value, 0);
        result.push({
          timestamp: window[Math.floor(windowSize / 2)].timestamp,
          value: sum / windowSize
        });
      }
      return result;
    }
  
    public static detectOutliers(dataPoints: DataPoint[], threshold = 2): DataPoint[] {
      if (dataPoints.length < 4) return [];
  
      const values = dataPoints.map(p => p.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      
      // Calculate standard deviation
      const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(variance);
  
      return dataPoints.filter(point => 
        Math.abs(point.value - mean) > threshold * stdDev
      );
    }
  
    public static interpolateGaps(dataPoints: DataPoint[], maxGapHours: number): DataPoint[] {
      const result: DataPoint[] = [...dataPoints];
      
      for (let i = 0; i < result.length - 1; i++) {
        const gap = (result[i + 1].timestamp.getTime() - result[i].timestamp.getTime()) / (1000 * 3600);
        
        if (gap > maxGapHours) {
          const steps = Math.ceil(gap / maxGapHours);
          const timeStep = gap / steps;
          const valueStep = (result[i + 1].value - result[i].value) / steps;
  
          for (let j = 1; j < steps; j++) {
            result.splice(i + j, 0, {
              timestamp: new Date(result[i].timestamp.getTime() + j * timeStep * 3600000),
              value: result[i].value + j * valueStep
            });
          }
          i += steps - 1;
        }
      }
  
      return result;
    }
  }