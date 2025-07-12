// Browser fingerprinting for vote uniqueness
export class FingerprintService {
  private static instance: FingerprintService;
  
  static getInstance(): FingerprintService {
    if (!FingerprintService.instance) {
      FingerprintService.instance = new FingerprintService();
    }
    return FingerprintService.instance;
  }

  async generateFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      this.getCanvasFingerprint(),
      this.getWebGLFingerprint(),
      navigator.hardwareConcurrency || 'unknown',
      (navigator as any).deviceMemory || 'unknown'
    ];

    const fingerprint = components.join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Voting fingerprint', 2, 2);
      
      return canvas.toDataURL().slice(-50);
    } catch {
      return 'canvas-error';
    }
  }

  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      
      const glContext = gl as WebGLRenderingContext;
      const renderer = glContext.getParameter(glContext.RENDERER);
      const vendor = glContext.getParameter(glContext.VENDOR);
      
      return `${vendor}|${renderer}`.slice(-30);
    } catch {
      return 'webgl-error';
    }
  }

  hasVotedInSession(sessionId: string): boolean {
    const key = `voted_${sessionId}`;
    return localStorage.getItem(key) === 'true';
  }

  markAsVoted(sessionId: string): void {
    const key = `voted_${sessionId}`;
    localStorage.setItem(key, 'true');
    
    // Also store in sessionStorage for incognito detection
    sessionStorage.setItem(key, 'true');
  }

  async checkVoteEligibility(sessionId: string, walletAddress?: string): Promise<{
    canVote: boolean;
    reason?: string;
    fingerprint: string;
  }> {
    const fingerprint = await this.generateFingerprint();
    
    // Check localStorage
    if (this.hasVotedInSession(sessionId)) {
      return {
        canVote: false,
        reason: 'You have already voted in this session from this device',
        fingerprint
      };
    }

    // Check fingerprint-based storage
    const fingerprintKey = `fp_${sessionId}_${fingerprint}`;
    if (localStorage.getItem(fingerprintKey)) {
      return {
        canVote: false,
        reason: 'A vote has already been cast from this device configuration',
        fingerprint
      };
    }

    return { canVote: true, fingerprint };
  }

  recordVote(sessionId: string, fingerprint: string): void {
    this.markAsVoted(sessionId);
    
    // Store fingerprint-based record
    const fingerprintKey = `fp_${sessionId}_${fingerprint}`;
    localStorage.setItem(fingerprintKey, new Date().toISOString());
  }
}

export const fingerprintService = FingerprintService.getInstance();