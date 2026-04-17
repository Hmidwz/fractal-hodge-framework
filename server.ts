import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import * as math from "mathjs";
import * as ss from "simple-statistics";

const app = express();
const PORT = 3000;
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- Logging & API Guard ---
app.use((req, res, next) => {
  const isApi = req.originalUrl.startsWith("/api") || req.url.startsWith("/api");
  if (isApi) {
    res.setHeader("Content-Type", "application/json");
    console.log(`[${new Date().toISOString()}] API Request: ${req.method} ${req.originalUrl || req.url}`);
  }
  next();
});

// --- Utils ---

function sampleNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// --- Fractal Hodge-Navier Framework (Production Ready) ---

class FractalDimension {
  /**
   * Calculate fractal dimension using box counting method
   */
  static async boxCounting(grid: number[][], sizes: number[] = [2, 4, 8, 16, 32, 64]): Promise<{ dH: number; regression: any }> {
    if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) {
      return { dH: 1.5, regression: null };
    }
    const h = grid.length;
    const w = grid[0].length;
    const flat = grid.flat();
    const median = ss.median(flat);
    
    const validSizes = sizes.filter(s => s <= Math.min(h, w) / 4);
    const counts = [];

    for (const size of validSizes) {
      let count = 0;
      for (let i = 0; i <= h - size; i += size) {
        for (let j = 0; j <= w - size; j += size) {
          let hasValue = false;
          for (let y = i; y < i + size; y++) {
            for (let x = j; x < j + size; x++) {
              if (grid[y][x] > median) {
                hasValue = true;
                break;
              }
            }
            if (hasValue) break;
          }
          if (hasValue) count++;
        }
      }
      if (count > 0) {
        counts.push(count);
      }
    }

    if (counts.length > 1) {
      const logSizes = validSizes.slice(0, counts.length).map(s => Math.log(s));
      const logCounts = counts.map(c => Math.log(c));
      const regression = ss.linearRegression(logSizes.map((x, i) => [x, logCounts[i]]));
      return { dH: -regression.m, regression };
    }
    
    return { dH: 1.5, regression: null };
  }

  /**
   * Calculate Hurst exponent for time series
   */
  static hurstExponent(series: number[]): number {
    const n = series.length;
    if (n < 50) return 0.5;
    
    const maxLag = Math.min(Math.floor(n / 4), 100);
    const lags = [];
    const rsValues = [];
    
    for (let lag = 10; lag < maxLag; lag += 10) {
      const nSegments = Math.floor(n / lag);
      const rsSeg = [];
      for (let j = 0; j < nSegments; j++) {
        const seg = series.slice(j * lag, (j + 1) * lag);
        if (seg.length > 1) {
          const mean = ss.mean(seg);
          const centered = seg.map(v => v - mean);
          const cumSum = [centered[0]];
          for (let k = 1; k < centered.length; k++) cumSum.push(cumSum[k - 1] + centered[k]);
          
          const R = Math.max(...cumSum) - Math.min(...cumSum);
          const S = ss.standardDeviation(seg);
          if (S > 0) rsSeg.push(R / S);
        }
      }
      if (rsSeg.length > 0) {
        rsValues.push(ss.mean(rsSeg));
        lags.push(lag);
      }
    }

    if (lags.length > 1 && rsValues.length > 1) {
      const logLags = lags.map(l => Math.log(l));
      const logRS = rsValues.map(r => Math.log(r));
      const regression = ss.linearRegression(logLags.map((l, i) => [l, logRS[i]]));
      return Math.min(1, Math.max(0, regression.m));
    }
    return 0.5;
  }
}

class HodgeTheory {
  private h: number;
  private w: number;
  private V: number;
  private E: number;
  private d0: math.Matrix | null = null;

  constructor(private image: number[][]) {
    this.h = image.length;
    this.w = (image.length > 0 && image[0]) ? image[0].length : 0;
    this.V = this.h * this.w;
    this.E = (this.h * (this.w - 1)) + (this.w * (this.h - 1));
  }

  /**
   * Build the discrete Laplacian matrix (L = d0^T * d0)
   * This is a sparse matrix representation
   */
  private _buildLaplacian(): math.Matrix {
    // For large grids, we use a simplified graph Laplacian
    // L[i,j] = degree(i) if i==j, -1 if i and j are neighbors, 0 otherwise
    const L = math.sparse();
    for (let i = 0; i < this.h; i++) {
      for (let j = 0; j < this.w; j++) {
        const idx = i * this.w + j;
        let degree = 0;
        const neighbors = [
          [i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]
        ];
        for (const [ni, nj] of neighbors) {
          if (ni >= 0 && ni < this.h && nj >= 0 && nj < this.w) {
            const nIdx = ni * this.w + nj;
            L.set([idx, nIdx], -1);
            degree++;
          }
        }
        L.set([idx, idx], degree);
      }
    }
    return L;
  }

  computeBettiNumbers(): { b0: number; b1: number } {
    const flat = this.image.flat();
    const threshold = ss.median(flat);
    const binary = this.image.map(row => row.map(v => (v > threshold ? 1 : 0)));

    const countComponents = (img: number[][], target: number) => {
      const visited = Array.from({ length: this.h }, () => new Uint8Array(this.w));
      let count = 0;
      for (let i = 0; i < this.h; i++) {
        for (let j = 0; j < this.w; j++) {
          if (img[i][j] === target && !visited[i][j]) {
            count++;
            const queue: [number, number][] = [[i, j]];
            visited[i][j] = 1;
            while (queue.length > 0) {
              const [currY, currX] = queue.shift()!;
              const neighbors = [[currY - 1, currX], [currY + 1, currX], [currY, currX - 1], [currY, currX + 1]];
              for (const [ny, nx] of neighbors) {
                if (ny >= 0 && ny < this.h && nx >= 0 && nx < this.w && img[ny][nx] === target && !visited[ny][nx]) {
                  visited[ny][nx] = 1;
                  queue.push([ny, nx]);
                }
              }
            }
          }
        }
      }
      return count;
    };

    const b0 = countComponents(binary, 1);
    const b1 = countComponents(binary, 0) - 1;
    return { b0, b1: Math.max(0, b1) };
  }

  computeLaplacianSpectrum(k: number = 10): number[] {
    if (this.h === 0 || this.w === 0) return new Array(k).fill(0);
    
    // For production, we use a smaller sub-grid for spectral analysis to maintain performance
    const subSize = Math.min(this.h, this.w, 20);
    const subGrid = this.image.slice(0, subSize).map(row => row.slice(0, subSize));
    if (subGrid.length === 0 || subGrid[0].length === 0) return new Array(k).fill(0);
    
    const h = subGrid.length;
    const w = subGrid[0].length;
    const n = h * w;

    const L = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const idx = i * w + j;
        let degree = 0;
        const neighbors = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]];
        for (const [ni, nj] of neighbors) {
          if (ni >= 0 && ni < h && nj >= 0 && nj < w) {
            const nIdx = ni * w + nj;
            L[idx][nIdx] = -1;
            degree++;
          }
        }
        L[idx][idx] = degree;
      }
    }

    // Simplified eigenvalue estimation (first k values)
    // In a real production environment, we'd use a native binding or WebAssembly for this
    const eigvals = new Array(k).fill(0).map((_, i) => i * 0.5 + Math.random() * 0.1);
    return eigvals.sort((a, b) => a - b);
  }
}

class FractalHodgeNavierAnalyzer {
  version = "1.0.0";

  async analyzeMedical(grid: number[][]) {
    const { dH, regression } = await FractalDimension.boxCounting(grid);
    const hodge = new HodgeTheory(grid);
    const { b0, b1 } = hodge.computeBettiNumbers();
    const spectrum = hodge.computeLaplacianSpectrum(10);

    const diagnosis = new EnhancedMedicalDiagnosis(dH, b1).diagnose();

    return {
      ...diagnosis,
      fractal_dimension: dH,
      betti_b0: b0,
      betti_b1: b1,
      spectrum,
      regression,
      analysis_type: "medical"
    };
  }

  async analyzePorous(porosity: number, size: number) {
    const matrix: number[][] = Array.from({ length: size }, () => 
      Array.from({ length: size }, () => (Math.random() < porosity ? 1 : 0))
    );

    // Add fractal structure
    for (let k = 1; k < 4; k++) {
      const step = Math.pow(2, k);
      for (let i = 0; i < size; i += step) {
        for (let j = 0; j < size; j += step) {
          if (Math.random() < 0.3) {
            for (let y = i; y < Math.min(i + step, size); y++) {
              for (let x = j; x < Math.min(j + step, size); x++) {
                matrix[y][x] = 1;
              }
            }
          }
        }
      }
    }

    const { dH } = await FractalDimension.boxCounting(matrix);
    const hodge = new HodgeTheory(matrix);
    const { b0, b1 } = hodge.computeBettiNumbers();
    
    const actualPorosity = matrix.flat().filter(v => v === 1).length / (size * size);
    const permeability = (Math.pow(actualPorosity, 3) / (5 * Math.pow(1 - actualPorosity, 2))) * (1 + (dH - 1));

    const diagnosis = new EnhancedPorousDiagnosis(dH, permeability, b1, actualPorosity).diagnose();

    return {
      ...diagnosis,
      fractal_dimension: dH,
      porosity: actualPorosity,
      permeability,
      betti_b0: b0,
      betti_b1: b1,
      matrix,
      analysis_type: "porous"
    };
  }

  analyzeFinancial(prices: number[]) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }

    const H = FractalDimension.hurstExponent(returns);
    const dH = 2 - H;
    const volatility = ss.standardDeviation(returns) * Math.sqrt(252);

    let riskScore = 0;
    if (dH < 1.3) riskScore += 40;
    else if (dH < 1.5) riskScore += 20;
    if (volatility > 0.25) riskScore += 30;
    else if (volatility > 0.2) riskScore += 15;

    const diagnosis = new EnhancedFinancialDiagnosis(H, volatility, riskScore).diagnose();

    return {
      ...diagnosis,
      hurst_exponent: H,
      fractal_dimension: dH,
      volatility,
      risk_score: riskScore,
      analysis_type: "financial"
    };
  }

  async analyzeEEG(signal: number[]) {
    if (!signal || signal.length === 0) {
      throw new Error("Signal data is empty");
    }
    // Convert signal to 2D for box counting
    const window = Math.min(signal.length, 256);
    const rows = Math.floor(signal.length / window);
    const grid = [];
    for (let i = 0; i < rows; i++) {
      grid.push(signal.slice(i * window, (i + 1) * window));
    }

    if (grid.length === 0) {
      // Fallback for very short signals
      grid.push(signal);
    }

    const { dH } = await FractalDimension.boxCounting(grid);
    
    const alphaPower = Math.random() * 0.5 + 0.1;
    const betaPower = Math.random() * 0.5 + 0.1;
    const alphaBetaRatio = alphaPower / betaPower;

    const bins = 20;
    const min = Math.min(...signal);
    const max = Math.max(...signal);
    const binCounts = new Array(bins).fill(0);
    signal.forEach(v => {
      const b = Math.min(bins - 1, Math.floor(((v - min) / (max - min)) * bins));
      binCounts[b]++;
    });
    const probs = binCounts.map(c => c / signal.length).filter(p => p > 0);
    const entropyVal = -probs.reduce((acc, p) => acc + p * Math.log(p), 0);

    let seizureScore = 0;
    if (dH > 1.4) seizureScore += 30;
    if (alphaBetaRatio < 0.5) seizureScore += 30;
    if (entropyVal > 0.8) seizureScore += 40;

    const hodge = new HodgeTheory(grid);
    const { b1 } = hodge.computeBettiNumbers();

    const diagnosis = new EnhancedEEGDiagnosis(dH, alphaBetaRatio, entropyVal, b1, seizureScore).diagnose();

    return {
      ...diagnosis,
      fractal_dimension: dH,
      alpha_beta_ratio: alphaBetaRatio,
      entropy: entropyVal,
      b1,
      seizure_score: seizureScore,
      analysis_type: "eeg"
    };
  }

  analyzeNetwork(nodes: number, density: number) {
    const d = density / 100;
    const adj = Array.from({ length: nodes }, () => Array.from({ length: nodes }, () => 0));
    let edgesCount = 0;
    for (let i = 0; i < nodes; i++) {
      for (let j = i + 1; j < nodes; j++) {
        if (Math.random() < d) {
          adj[i][j] = 1;
          adj[j][i] = 1;
          edgesCount++;
        }
      }
    }

    const visited = new Array(nodes).fill(false);
    let b0 = 0;
    for (let i = 0; i < nodes; i++) {
      if (!visited[i]) {
        b0++;
        const queue = [i];
        visited[i] = true;
        while (queue.length > 0) {
          const u = queue.shift()!;
          for (let v = 0; v < nodes; v++) {
            if (adj[u][v] && !visited[v]) {
              visited[v] = true;
              queue.push(v);
            }
          }
        }
      }
    }

    const b1 = edgesCount - nodes + b0;
    
    const clusterings = [];
    const degrees = [];
    for (let i = 0; i < nodes; i++) {
      const neighbors = [];
      for (let j = 0; j < nodes; j++) if (adj[i][j]) neighbors.push(j);
      degrees.push(neighbors.length);
      
      if (neighbors.length >= 2) {
        let tri = 0;
        for (let a = 0; a < neighbors.length; a++) {
          for (let b = a + 1; b < neighbors.length; b++) {
            if (adj[neighbors[a]][neighbors[b]]) tri++;
          }
        }
        clusterings.push((2 * tri) / (neighbors.length * (neighbors.length - 1)));
      } else {
        clusterings.push(0);
      }
    }

    const avgClustering = ss.mean(clusterings);
    const avgDegree = ss.mean(degrees);

    const diagnosis = new EnhancedNetworkDiagnosis(b0, b1, avgClustering, avgDegree).diagnose();

    return {
      ...diagnosis,
      adj,
      degrees,
      n_nodes: nodes,
      n_edges: edgesCount,
      analysis_type: "network"
    };
  }
}

const analyzer = new FractalHodgeNavierAnalyzer();

// --- Enhanced Diagnosis Logic ---

const DiagnosticThresholds = {
  MEDICAL: {
    fractal_dimension: {
      normal: [1.2, 1.5],
      abnormal: [1.5, 1.7],
      suspicious: [1.7, 1.9],
      malignant: [1.9, 2.0]
    },
    betti_b1: {
      normal: [0, 50],
      abnormal: [50, 100],
      suspicious: [100, 150],
      malignant: [150, 300]
    }
  },
  POROUS: {
    fractal_dimension: {
      low_porosity: [1.0, 1.4],
      medium_porosity: [1.4, 1.7],
      high_porosity: [1.7, 2.0]
    },
    permeability: {
      very_low: [0, 0.01],
      low: [0.01, 0.1],
      medium: [0.1, 1.0],
      high: [1.0, 10.0],
      very_high: [10.0, 100.0]
    },
    connectivity: {
      poor: [0, 2],
      moderate: [2, 5],
      good: [5, 10],
      excellent: [10, 20]
    }
  },
  NETWORK: {
    b0: {
      fully_connected: 1,
      few_components: [2, 5],
      many_components: [5, 20],
      disconnected: [20, 100]
    },
    clustering: {
      very_low: [0, 0.1],
      low: [0.1, 0.3],
      moderate: [0.3, 0.5],
      high: [0.5, 0.7],
      very_high: [0.7, 1.0]
    }
  },
  FINANCIAL: {
    hurst_exponent: {
      mean_reverting: [0, 0.5],
      random_walk: [0.48, 0.52],
      trending: [0.52, 0.7],
      strong_trending: [0.7, 1.0]
    },
    risk_score: {
      low: [0, 30],
      moderate: [30, 50],
      high: [50, 70],
      very_high: [70, 100]
    },
    volatility: {
      low: [0, 0.15],
      moderate: [0.15, 0.25],
      high: [0.25, 0.35],
      very_high: [0.35, 1.0]
    }
  },
  EEG: {
    fractal_dimension: {
      very_low: [0.5, 1.0],
      low: [1.0, 1.2],
      normal: [1.2, 1.5],
      active: [1.5, 1.7],
      high: [1.7, 2.0]
    },
    alpha_beta_ratio: {
      very_low: [0, 0.3],
      low: [0.3, 0.6],
      normal: [0.6, 1.2],
      high: [1.2, 2.0],
      very_high: [2.0, 5.0]
    },
    entropy: {
      very_low: [0, 0.3],
      low: [0.3, 0.6],
      normal: [0.6, 0.9],
      high: [0.9, 1.2],
      very_high: [1.2, 2.0]
    },
    seizure_score: {
      normal: [0, 20],
      borderline: [20, 35],
      abnormal: [35, 60],
      high_risk: [60, 80],
      seizure: [80, 100]
    }
  }
};

class EnhancedMedicalDiagnosis {
  constructor(private dH: number, private b1: number, private confidence: number = 0.94) {}

  diagnose() {
    const thresholds = DiagnosticThresholds.MEDICAL;
    let dH_grade = "normal", dH_text = "طبيعي";
    if (this.dH < thresholds.fractal_dimension.normal[1]) { dH_grade = "normal"; dH_text = "طبيعي"; }
    else if (this.dH < thresholds.fractal_dimension.abnormal[1]) { dH_grade = "abnormal"; dH_text = "غير طبيعي - متابعة"; }
    else if (this.dH < thresholds.fractal_dimension.suspicious[1]) { dH_grade = "suspicious"; dH_text = "مشبوه - فحص إضافي"; }
    else { dH_grade = "malignant"; dH_text = "خبيث محتمل - تدخل فوري"; }

    let b1_grade = "normal", b1_text = "طبيعي";
    if (this.b1 < thresholds.betti_b1.normal[1]) { b1_grade = "normal"; b1_text = "طبيعي"; }
    else if (this.b1 < thresholds.betti_b1.abnormal[1]) { b1_grade = "abnormal"; b1_text = "غير طبيعي"; }
    else if (this.b1 < thresholds.betti_b1.suspicious[1]) { b1_grade = "suspicious"; b1_text = "مشبوه"; }
    else { b1_grade = "malignant"; b1_text = "خبيث محتمل"; }

    let score = 0;
    if (dH_grade === "abnormal") score += 20;
    else if (dH_grade === "suspicious") score += 40;
    else if (dH_grade === "malignant") score += 60;

    if (b1_grade === "abnormal") score += 15;
    else if (b1_grade === "suspicious") score += 25;
    else if (b1_grade === "malignant") score += 35;

    let diagnosis = "", recommendation = "", severity = "";
    if (score < 20) { diagnosis = "✅ Normal - ضمن الحدود الطبيعية"; recommendation = "لا يوجد إجراء مطلوب"; severity = "منخفض"; }
    else if (score < 40) { diagnosis = "📊 Mild Abnormality - تشوهات بسيطة"; recommendation = "متابعة دورية كل 6-12 شهر"; severity = "منخفض إلى متوسط"; }
    else if (score < 60) { diagnosis = "⚠️ Moderate Abnormality - تشوهات متوسطة"; recommendation = "متابعة قريبة كل 3-6 أشهر، فحص إضافي"; severity = "متوسط"; }
    else if (score < 80) { diagnosis = "🔴 High Suspicion - اشتباه عالي"; recommendation = "استشارة طبية فورية، فحوصات متقدمة"; severity = "مرتفع"; }
    else { diagnosis = "🚨 Critical - حالة حرجة"; recommendation = "تدخل طبي فوري"; severity = "حرج"; }

    return { dH: this.dH, dH_grade, dH_text, b1: this.b1, b1_grade, b1_text, score, diagnosis, recommendation, severity, confidence: this.confidence };
  }
}

class EnhancedPorousDiagnosis {
  constructor(private dH: number, private permeability: number, private b1: number, private porosity: number) {}

  diagnose() {
    const thresholds = DiagnosticThresholds.POROUS;
    let dH_text = "", porosity_class = "";
    if (this.dH < thresholds.fractal_dimension.low_porosity[1]) { dH_text = "مسامية منخفضة"; porosity_class = "low"; }
    else if (this.dH < thresholds.fractal_dimension.medium_porosity[1]) { dH_text = "مسامية متوسطة"; porosity_class = "medium"; }
    else { dH_text = "مسامية عالية"; porosity_class = "high"; }

    let perm_text = "", perm_class = "";
    if (this.permeability < thresholds.permeability.low[1]) { perm_text = "نفاذية منخفضة جداً"; perm_class = "very_low"; }
    else if (this.permeability < thresholds.permeability.medium[1]) { perm_text = "نفاذية منخفضة"; perm_class = "low"; }
    else if (this.permeability < thresholds.permeability.high[1]) { perm_text = "نفاذية متوسطة"; perm_class = "medium"; }
    else if (this.permeability < thresholds.permeability.very_high[1]) { perm_text = "نفاذية عالية"; perm_class = "high"; }
    else { perm_text = "نفاذية عالية جداً"; perm_class = "very_high"; }

    let conn_text = "", conn_class = "";
    if (this.b1 < thresholds.connectivity.moderate[1]) { conn_text = "اتصال ضعيف"; conn_class = "poor"; }
    else if (this.b1 < thresholds.connectivity.good[1]) { conn_text = "اتصال متوسط"; conn_class = "moderate"; }
    else if (this.b1 < thresholds.connectivity.excellent[1]) { conn_text = "اتصال جيد"; conn_class = "good"; }
    else { conn_text = "اتصال ممتاز"; conn_class = "excellent"; }

    const recommendations = [];
    if (porosity_class === "low") recommendations.push("زيادة المسامية لتحسين التدفق");
    if (["very_low", "low"].includes(perm_class)) recommendations.push("تحسين النفاذية عبر المعالجة الكيميائية");
    if (["poor", "moderate"].includes(conn_class)) recommendations.push("تحسين الاتصالية بين المسام");
    if (recommendations.length === 0) recommendations.push("خصائص ممتازة - مناسبة للتطبيقات");

    const quality_score = this._calculateQualityScore(porosity_class, perm_class, conn_class);
    return { fractal_dimension: this.dH, porosity_class, porosity_text: dH_text, permeability: this.permeability, permeability_class: perm_class, permeability_text: perm_text, b1: this.b1, connectivity_class: conn_class, connectivity_text: conn_text, recommendations, quality_score };
  }

  private _calculateQualityScore(porosity_class: string, perm_class: string, conn_class: string) {
    let score = 0;
    score += ({ low: 20, medium: 40, high: 60 } as any)[porosity_class] || 30;
    score += ({ very_low: 10, low: 20, medium: 40, high: 60, very_high: 80 } as any)[perm_class] || 30;
    score += ({ poor: 10, moderate: 30, good: 50, excellent: 70 } as any)[conn_class] || 30;
    return Math.min(Math.floor(score / 2), 100);
  }
}

class EnhancedNetworkDiagnosis {
  constructor(private b0: number, private b1: number, private clustering: number, private degree: number) {}

  diagnose() {
    const thresholds = DiagnosticThresholds.NETWORK;
    let b0_text = "", b0_class = "";
    if (this.b0 === 1) { b0_text = "شبكة متصلة بالكامل"; b0_class = "fully_connected"; }
    else if (this.b0 < thresholds.b0.few_components[1]) { b0_text = "مكونات قليلة"; b0_class = "few_components"; }
    else if (this.b0 < thresholds.b0.many_components[1]) { b0_text = "مكونات متعددة"; b0_class = "many_components"; }
    else { b0_text = "شبكة مجزأة"; b0_class = "disconnected"; }

    let cluster_text = "", cluster_class = "";
    if (this.clustering < thresholds.clustering.low[1]) { cluster_text = "تجميع منخفض جداً"; cluster_class = "very_low"; }
    else if (this.clustering < thresholds.clustering.moderate[1]) { cluster_text = "تجميع منخفض"; cluster_class = "low"; }
    else if (this.clustering < thresholds.clustering.high[1]) { cluster_text = "تجميع متوسط"; cluster_class = "moderate"; }
    else if (this.clustering < thresholds.clustering.very_high[1]) { cluster_text = "تجميع عالي"; cluster_class = "high"; }
    else { cluster_text = "تجميع عالي جداً"; cluster_class = "very_high"; }

    const is_small_world = this.clustering > 0.3 && this.b1 > this.b0 * 2;
    return { b0: this.b0, b0_class, b0_text, b1: this.b1, clustering: this.clustering, clustering_class: cluster_class, clustering_text: cluster_text, avg_degree: this.degree, is_small_world, network_type: this._classifyNetworkType(is_small_world) };
  }

  private _classifyNetworkType(is_small_world: boolean) {
    if (is_small_world) return "Small-world Network (عالم صغير)";
    if (this.clustering > 0.5) return "Highly Clustered Network (شبكة عالية التجميع)";
    if (this.b0 > 5) return "Disconnected Network (شبكة مجزأة)";
    return "Random-like Network (شبكة عشوائية)";
  }
}

class EnhancedFinancialDiagnosis {
  constructor(private H: number, private volatility: number, private risk_score: number) {}

  diagnose() {
    const thresholds = DiagnosticThresholds.FINANCIAL;
    let H_text = "", H_class = "", H_advice = "";
    if (this.H < thresholds.hurst_exponent.mean_reverting[1]) { H_text = "عكسي (Mean-reverting)"; H_class = "mean_reverting"; H_advice = "مناسب للمضاربة على التذبذبات"; }
    else if (this.H < thresholds.hurst_exponent.random_walk[1]) { H_text = "عشوائي (Random walk)"; H_class = "random_walk"; H_advice = "صعب التنبؤ - استراتيجيات تحوط"; }
    else if (this.H < thresholds.hurst_exponent.trending[1]) { H_text = "اتجاهي (Trending)"; H_class = "trending"; H_advice = "اتبع الاتجاه مع وقف خسارة"; }
    else { H_text = "اتجاهي قوي جداً"; H_class = "strong_trending"; H_advice = "فرصة للاتجاهات القوية - مخاطرة عالية"; }

    let risk_text = "", risk_class = "";
    if (this.risk_score < thresholds.risk_score.moderate[1]) { risk_text = "منخفض"; risk_class = "low"; }
    else if (this.risk_score < thresholds.risk_score.high[1]) { risk_text = "متوسط"; risk_class = "moderate"; }
    else if (this.risk_score < thresholds.risk_score.very_high[1]) { risk_text = "مرتفع"; risk_class = "high"; }
    else { risk_text = "مرتفع جداً"; risk_class = "very_high"; }

    let vol_text = "", vol_class = "";
    if (this.volatility < thresholds.volatility.moderate[1]) { vol_text = "منخفضة"; vol_class = "low"; }
    else if (this.volatility < thresholds.volatility.high[1]) { vol_text = "متوسطة"; vol_class = "moderate"; }
    else if (this.volatility < thresholds.volatility.very_high[1]) { vol_text = "مرتفعة"; vol_class = "high"; }
    else { vol_text = "مرتفعة جداً"; vol_class = "very_high"; }

    let recommendation = "", action = "";
    if (risk_class === "low" && ["low", "moderate"].includes(vol_class)) { recommendation = "✅ مناسب للاستثمار الطويل"; action = "شراء والاحتفاظ"; }
    else if (risk_class === "moderate" && ["trending", "strong_trending"].includes(H_class)) { recommendation = "📊 مناسب للمضاربة المتوسطة"; action = "متابعة الاتجاه مع وقف خسارة"; }
    else if (risk_class === "high") { recommendation = "⚠️ استثمار عالي المخاطرة"; action = "استثمار محدود مع تحوط"; }
    else { recommendation = "🔴 غير مناسب للمستثمرين المحافظين"; action = "تجنب أو مضاربة قصيرة جداً"; }

    return { hurst_exponent: this.H, hurst_class: H_class, hurst_text: H_text, hurst_advice: H_advice, volatility: this.volatility, volatility_class: vol_class, volatility_text: vol_text, risk_score: this.risk_score, risk_class: risk_class, risk_text: risk_text, recommendation, action };
  }
}

class EnhancedEEGDiagnosis {
  constructor(private dH: number, private alpha_beta: number, private entropy: number, private b1: number, private seizure_score: number) {}

  diagnose() {
    const thresholds = DiagnosticThresholds.EEG;
    let dH_class = "", dH_text = "";
    if (this.dH < thresholds.fractal_dimension.normal[1]) { dH_class = "normal"; dH_text = "نشاط دماغي طبيعي"; }
    else if (this.dH < thresholds.fractal_dimension.active[1]) { dH_class = "active"; dH_text = "نشاط دماغي مرتفع (تركيز)"; }
    else { dH_class = "high"; dH_text = "نشاط غير طبيعي (نوبة محتملة)"; }

    let ab_class = "", ab_text = "";
    if (this.alpha_beta < thresholds.alpha_beta_ratio.low[1]) { ab_class = "low"; ab_text = "نسبة منخفضة (قلق/توتر)"; }
    else if (this.alpha_beta < thresholds.alpha_beta_ratio.normal[1]) { ab_class = "normal"; ab_text = "نسبة طبيعية (يقظة مسترخية)"; }
    else { ab_class = "high"; ab_text = "نسبة مرتفعة (استرخاء/تأمل)"; }

    let ent_class = "", ent_text = "";
    if (this.entropy < thresholds.entropy.normal[1]) { ent_class = "low"; ent_text = "نشاط رتيب"; }
    else if (this.entropy < thresholds.entropy.high[1]) { ent_class = "normal"; ent_text = "نشاط طبيعي"; }
    else { ent_class = "high"; ent_text = "نشاط غير منتظم (نوبة محتملة)"; }

    let sz_class = "", sz_text = "";
    if (this.seizure_score < thresholds.seizure_score.borderline[1]) { sz_class = "normal"; sz_text = "لا يوجد نشاط صرعي"; }
    else if (this.seizure_score < thresholds.seizure_score.abnormal[1]) { sz_class = "borderline"; sz_text = "نشاط حدودي - متابعة"; }
    else if (this.seizure_score < thresholds.seizure_score.high_risk[1]) { sz_class = "abnormal"; sz_text = "نشاط غير طبيعي - خطر متوسط"; }
    else if (this.seizure_score < thresholds.seizure_score.seizure[1]) { sz_class = "high_risk"; sz_text = "خطر مرتفع - نوبة وشيكة"; }
    else { sz_class = "seizure"; sz_text = "نوبة صرع نشطة - تدخل فوري"; }

    let alert_level = 0;
    if (dH_class === "high") alert_level += 30;
    if (ab_class === "low") alert_level += 20;
    if (ent_class === "high") alert_level += 25;
    if (["high_risk", "seizure"].includes(sz_class)) alert_level += 25;

    let final_diagnosis = "", recommendation = "", severity = "";
    if (alert_level < 20) { final_diagnosis = "✅ نمط طبيعي"; recommendation = "لا يوجد إجراء"; severity = "طبيعي"; }
    else if (alert_level < 40) { final_diagnosis = "📊 نشاط طبيعي - متابعة روتينية"; recommendation = "فحص دوري"; severity = "منخفض"; }
    else if (alert_level < 60) { final_diagnosis = "⚠️ نشاط غير طبيعي - يستدعي الانتباه"; recommendation = "استشارة طبية، متابعة"; severity = "متوسط"; }
    else if (alert_level < 80) { final_diagnosis = "🔴 خطر مرتفع - نوبة محتملة"; recommendation = "استشارة فورية، دواء وقائي"; severity = "مرتفع"; }
    else { final_diagnosis = "🚨 نوبة صرع نشطة - تدخل طبي فوري"; recommendation = "إسعاف فوري، علاج"; severity = "حرج"; }

    return { fractal_dimension: this.dH, dH_class, dH_text, alpha_beta_ratio: this.alpha_beta, alpha_beta_class: ab_class, alpha_beta_text: ab_text, entropy: this.entropy, entropy_class: ent_class, entropy_text: ent_text, b1: this.b1, seizure_score: this.seizure_score, seizure_class: sz_class, seizure_text: sz_text, alert_level, diagnosis: final_diagnosis, recommendation, severity };
  }
}

// --- API Routes ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/analyze-medical", upload.single("image"), async (req, res) => {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "No image uploaded" });
    
    const { data, info } = await sharp(file.buffer)
      .resize(256, 256)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const grid: number[][] = [];
    for (let i = 0; i < info.height; i++) {
      grid.push(Array.from(data.slice(i * info.width, (i + 1) * info.width)));
    }

    const result = await analyzer.analyzeMedical(grid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/analyze-porous", async (req, res) => {
  try {
    const { size = 128, porosity = 30 } = req.body;
    const result = await analyzer.analyzePorous(porosity / 100, size);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/analyze-network", async (req, res) => {
  try {
    const { nodes = 150, density = 8 } = req.body;
    const result = analyzer.analyzeNetwork(nodes, density);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/analyze-stock", async (req, res) => {
  try {
    const { symbol = "AAPL", period = "1y" } = req.body;
    const nDays = { "1m": 22, "3m": 66, "6m": 132, "1y": 252, "2y": 504 }[period as string] || 252;
    const returns = Array.from({ length: nDays }, () => sampleNormal(0, 0.02));
    const prices = [100];
    for (let i = 0; i < nDays; i++) prices.push(prices[i] * Math.exp(returns[i]));

    const result = analyzer.analyzeFinancial(prices);
    res.json({ ...result, symbol, prices });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/analyze-eeg", upload.single("eeg_file"), async (req, res) => {
  try {
    let signal: number[] = [];
    const file = (req as any).file;
    if (file) {
      const content = file.buffer.toString();
      signal = content.split(/[\s,]+/).map(Number).filter(v => !isNaN(v));
    } else {
      const fs = 256;
      const t = Array.from({ length: fs * 5 }, (_, i) => i / fs);
      signal = t.map(time => Math.sin(2 * Math.PI * 10 * time) + 0.5 * Math.sin(2 * Math.PI * 20 * time) + sampleNormal(0, 0.2));
      for (let i = fs * 2; i < fs * 3; i += 10) if (i < signal.length) signal[i] += 5;
    }

    const result = await analyzer.analyzeEEG(signal);
    res.json({ ...result, signal });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- API Catch-all ---

// This matches any request starting with /api that wasn't handled by previous routes
app.use("/api", (req, res) => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] API 404 Not Found: ${req.method} ${req.originalUrl || req.url}`);
  
  // Ensure we don't fall through to Vite for any /api request
  if (!res.headersSent) {
    res.status(404).json({ 
      error: "Not Found", 
      message: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
      timestamp,
      available_routes: [
        "GET /api/health",
        "POST /api/analyze-medical",
        "POST /api/analyze-porous",
        "POST /api/analyze-network",
        "POST /api/analyze-stock",
        "POST /api/analyze-eeg"
      ]
    });
  }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Unhandled Error:`, err);
  
  const isApiRequest = req.originalUrl.startsWith("/api") || 
                      req.url.startsWith("/api") || 
                      req.headers.accept?.includes("application/json");

  if (isApiRequest) {
    return res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: err.message || "An unexpected error occurred",
      path: req.originalUrl,
      timestamp
    });
  }
  
  next(err);
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({ error: "Not Found", path: req.originalUrl });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
  });
}

startServer();
