# Git-Integrated Data Schema Design

Last updated: 2025-08-15

## 🎯 Core Data Models for Enhanced Tracking

### Time Session with Git Correlation

```typescript
interface EnhancedTimeSession {
  _id: ObjectId;
  userId: string;
  projectId: string;
  startedAt: Date;
  endedAt?: Date | null;
  duration: number; // calculated in seconds
  
  // Git Integration
  gitActivity: {
    repositoryUrl: string;
    branch: string;
    commitsDuring: string[]; // commit hashes during session
    filesModified: string[];
    linesAdded: number;
    linesDeleted: number;
    lastCommitHash?: string;
  };
  
  // IDE Activity
  ideActivity: {
    editor: 'vscode' | 'jetbrains' | 'vim' | 'sublime';
    keystrokeCount: number;
    activeFileTime: FileTimeMap; // time spent per file
    languageBreakdown: LanguageTimeMap;
    focusPeriods: FocusPeriod[];
  };
  
  // Context & Classification
  classification: {
    activityType: 'coding' | 'debugging' | 'testing' | 'documentation' | 'meeting' | 'research';
    productivity: number; // 0-100 score
    complexity: 'low' | 'medium' | 'high';
    interruptions: number;
  };
  
  // Metadata
  metadata: {
    deviceId: string;
    ipAddress: string;
    timezone: string;
    tags: string[];
    notes?: string;
  };
}
```

### Git Repository Intelligence

```typescript
interface GitRepository {
  _id: ObjectId;
  url: string;
  name: string;
  projectId: string;
  
  // Repository Health
  health: {
    commitFrequency: number; // commits per day average
    branchCount: number;
    contributors: number;
    lastActivity: Date;
    technicalDebt: number; // 0-100 score
  };
  
  // Language & Technology Detection
  technologies: {
    languages: LanguageStats[];
    frameworks: string[];
    buildTools: string[];
    dependencies: DependencyInfo[];
  };
  
  // Analysis Results
  analysis: {
    codeComplexity: number;
    testCoverage: number;
    documentationRatio: number;
    securityScore: number;
  };
}
```

### Commit Intelligence

```typescript
interface CommitAnalysis {
  _id: ObjectId;
  hash: string;
  repositoryId: ObjectId;
  sessionId?: ObjectId; // linked to time session
  
  // Basic Info
  author: string;
  timestamp: Date;
  message: string;
  branch: string;
  
  // Change Analysis
  changes: {
    filesModified: FileChange[];
    linesAdded: number;
    linesDeleted: number;
    complexity: number;
    testFiles: string[];
  };
  
  // Classification
  type: 'feature' | 'bugfix' | 'refactor' | 'documentation' | 'test' | 'chore';
  impact: 'low' | 'medium' | 'high';
  risk: number; // 0-100
  
  // Time Correlation
  estimatedTimeSpent: number; // minutes
  correlatedSessions: ObjectId[];
  
  // Quality Metrics
  quality: {
    messageQuality: number; // 0-100
    codeQuality: number;
    testCoverage: number;
    reviewComments?: number;
  };
}
```

### Project Analytics Aggregation

```typescript
interface ProjectAnalytics {
  _id: ObjectId;
  projectId: ObjectId;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  
  // Time Metrics
  timeMetrics: {
    totalTime: number;
    activeTime: number;
    focusTime: number;
    breakTime: number;
    productiveHours: HourlyBreakdown;
  };
  
  // Development Metrics
  development: {
    commits: number;
    linesOfCode: number;
    filesModified: number;
    featuresCompleted: number;
    bugsFixed: number;
    testsWritten: number;
  };
  
  // Quality Metrics
  quality: {
    codeQuality: number;
    testCoverage: number;
    performanceScore: number;
    securityScore: number;
    technicalDebt: number;
  };
  
  // Technology Usage
  technologies: {
    languages: LanguageUsage[];
    frameworks: FrameworkUsage[];
    tools: ToolUsage[];
  };
  
  // Productivity Insights
  insights: {
    peakHours: number[];
    averageFocusSession: number;
    interruptionRate: number;
    contextSwitching: number;
    velocityTrend: 'increasing' | 'stable' | 'decreasing';
  };
}
```

## 🔄 Real-time Data Collection Pipeline

### Git Hooks Integration

```typescript
interface GitHookProcessor {
  // Pre-commit hook
  async preCommit(changes: FileChange[]): Promise<void> {
    const complexity = await this.analyzeComplexity(changes);
    const estimatedTime = this.estimateCommitTime(changes);
    
    await this.correlateWithActiveSession({
      filesModified: changes.map(c => c.filename),
      complexity,
      estimatedTime
    });
  }
  
  // Post-commit hook
  async postCommit(commit: CommitData): Promise<void> {
    const analysis = await this.analyzeCommit(commit);
    await this.updateSessionMetrics(analysis);
    await this.triggerQualityAnalysis(commit);
  }
  
  // Branch analysis
  async analyzeBranch(branch: string): Promise<BranchAnalytics> {
    return {
      commits: await this.getCommitCount(branch),
      timeSpent: await this.calculateBranchTime(branch),
      complexity: await this.analyzeBranchComplexity(branch),
      contributors: await this.getBranchContributors(branch)
    };
  }
}
```

### IDE Plugin Data Collection

```typescript
interface IDEDataCollector {
  // File activity tracking
  async trackFileActivity(file: string, activity: FileActivity): Promise<void> {
    await this.updateFileMetrics({
      filename: file,
      timeSpent: activity.duration,
      keystrokes: activity.keystrokes,
      language: this.detectLanguage(file),
      linesModified: activity.linesChanged
    });
  }
  
  // Build system integration
  async trackBuildEvents(build: BuildEvent): Promise<void> {
    await this.recordBuildMetrics({
      projectId: build.projectId,
      buildTool: build.tool,
      duration: build.duration,
      success: build.success,
      testsRun: build.tests?.total,
      testsPassed: build.tests?.passed
    });
  }
  
  // Debug session tracking
  async trackDebugging(session: DebugSession): Promise<void> {
    await this.recordDebuggingTime({
      sessionId: session.timeSessionId,
      tool: session.debugger,
      duration: session.duration,
      breakpoints: session.breakpointsHit,
      issuesResolved: session.issuesFixed
    });
  }
}
```

## 📊 Advanced Analytics Schema

### Productivity Correlation Matrix

```typescript
interface ProductivityCorrelation {
  _id: ObjectId;
  userId: ObjectId;
  calculatedAt: Date;
  
  correlations: {
    timeVsQuality: number; // -1 to 1
    focusVsProductivity: number;
    commitSizeVsTime: number;
    languageVsSpeed: number;
    timeOfDayVsPerformance: HourlyCorrelation[];
  };
  
  recommendations: {
    optimalSessionLength: number;
    bestWorkingHours: number[];
    suggestedBreaks: number;
    focusImprovements: string[];
  };
}
```

### Technology Proficiency Tracking

```typescript
interface TechnologyProficiency {
  _id: ObjectId;
  userId: ObjectId;
  technology: string;
  category: 'language' | 'framework' | 'tool' | 'database';
  
  proficiency: {
    level: number; // 0-100
    confidence: number; // 0-100
    trend: 'improving' | 'stable' | 'declining';
    lastUsed: Date;
  };
  
  metrics: {
    totalTime: number;
    projectsUsed: number;
    linesWritten: number;
    errorsEncountered: number;
    problemsSolved: number;
  };
  
  milestones: {
    firstUse: Date;
    proficiencyLevels: ProficiencyMilestone[];
    certifications?: Certification[];
  };
}
```

## 🎯 Data Collection Strategy

### Lightweight Collection Points

1. **Git Hooks**: Minimal overhead, maximum insight
2. **IDE Language Server**: Real-time without performance impact
3. **Build System Webhooks**: Automated collection from CI/CD
4. **File System Watchers**: Efficient file change detection
5. **Process Monitoring**: Non-intrusive activity detection

### Privacy-First Design

```typescript
interface PrivacyConfig {
  dataCollection: {
    collectFileContents: boolean; // default: false
    collectKeystrokes: boolean;   // default: false
    collectScreenshots: boolean;  // default: false
    hashFilenames: boolean;       // default: true
    anonymizeCommits: boolean;    // default: false
  };
  
  retention: {
    rawData: '7_days';
    aggregatedData: '2_years';
    analytics: 'forever';
  };
  
  sharing: {
    allowTeamInsights: boolean;
    allowBenchmarking: boolean;
    exportData: boolean;
  };
}
```

### Performance Optimization

```typescript
interface OptimizationStrategy {
  collection: {
    batchSize: 100;
    flushInterval: '30_seconds';
    compressionLevel: 'high';
    asyncProcessing: true;
  };
  
  storage: {
    hotData: 'memory'; // last 24h
    warmData: 'ssd';   // last 30 days
    coldData: 'cloud'; // older data
  };
  
  indexing: {
    timeRange: true;
    userId: true;
    projectId: true;
    technology: true;
    composite: ['userId', 'projectId', 'timeRange'];
  };
}
```

This enhanced schema design provides:

- **Better than WakaTime**: Git correlation, quality metrics, and productivity insights
- **Low System Overhead**: Efficient collection and storage strategies
- **Privacy-Focused**: Configurable data collection with user control
- **Rich Analytics**: Multi-dimensional analysis capabilities
- **Real-time Processing**: Immediate insights and recommendations

The system captures not just time, but the quality and context of work, providing unprecedented insights into development productivity and patterns.
