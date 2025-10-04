// app/main/admin/ai-insights/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { DataTable, EmptyState, ChartCard } from '@/components/mainapp/components'
import { Bot, AlertTriangle, TrendingUp, Brain, Target, Zap, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { useTheme } from '@/components/ThemeContext'

interface AnomalyFlag {
  id: string
  entity_type: string
  entity_id: string
  anomaly_type: string
  severity: 'low' | 'medium' | 'high'
  details: any
  flagged_at: string
  resolved_at?: string
}

interface AIInsight {
  type: string
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
}

export default function AdminAIInsights() {
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [sentimentTrend, setSentimentTrend] = useState<any[]>([])
  const { isDark } = useTheme()

  const fetchAIData = async () => {
    try {
      setLoading(true)
      // Mock data for demonstration - replace with real AI service calls
      const mockAnomalies: AnomalyFlag[] = [
        {
          id: '1',
          entity_type: 'poll',
          entity_id: 'poll-123',
          anomaly_type: 'unusual_voting_pattern',
          severity: 'high',
          details: { votes_in_hour: 45, normal_range: '5-15' },
          flagged_at: new Date().toISOString()
        },
        {
          id: '2',
          entity_type: 'complaint',
          entity_id: 'complaint-456',
          anomaly_type: 'sentiment_spike',
          severity: 'medium',
          details: { sentiment_score: -0.8, normal_range: '-0.3 to 0.3' },
          flagged_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]

      const mockInsights: AIInsight[] = [
        {
          type: 'engagement_pattern',
          title: 'Peak Engagement Hours Detected',
          description: 'Community is most active between 7-9 PM weekdays. Consider scheduling important polls during this time.',
          confidence: 0.87,
          impact: 'medium',
          actionable: true
        },
        {
          type: 'sentiment_analysis',
          title: 'Improving Community Sentiment',
          description: 'Overall sentiment has improved by 15% over the past month, particularly in governance-related discussions.',
          confidence: 0.92,
          impact: 'high',
          actionable: false
        },
        {
          type: 'participation_forecast',
          title: 'Predicted Participation Drop',
          description: 'ML model predicts 20% decrease in poll participation next week based on historical patterns.',
          confidence: 0.73,
          impact: 'medium',
          actionable: true
        }
      ]

      const mockSentimentTrend = [
        { date: '2024-01', positive: 0.65, negative: -0.15, neutral: 0.2 },
        { date: '2024-02', positive: 0.70, negative: -0.12, neutral: 0.18 },
        { date: '2024-03', positive: 0.68, negative: -0.08, neutral: 0.24 },
        { date: '2024-04', positive: 0.72, negative: -0.10, neutral: 0.18 },
        { date: '2024-05', positive: 0.75, negative: -0.06, neutral: 0.19 },
        { date: '2024-06', positive: 0.78, negative: -0.04, neutral: 0.18 }
      ]

      setAnomalies(mockAnomalies)
      setInsights(mockInsights)
      setSentimentTrend(mockSentimentTrend)
    } catch (error) {
      console.error('Failed to fetch AI data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAIData()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const anomalyColumns = [
    {
      key: 'anomaly_type' as const,
      header: 'Anomaly Type',
      render: (value: string) => (
        <div>
          <div className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value.replace('_', ' ')}
          </div>
        </div>
      )
    },
    {
      key: 'entity_type' as const,
      header: 'Entity',
      render: (value: string, row: AnomalyFlag) => (
        <div className="text-sm">
          <div className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
          <div className={`${isDark ? 'text-white' : 'text-gray-500'}`}>{row.entity_id.slice(0, 12)}...</div>
        </div>
      )
    },
    {
      key: 'severity' as const,
      header: 'Severity',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'flagged_at' as const,
      header: 'Detected',
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      key: 'resolved_at' as const,
      header: 'Status',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {value ? 'Resolved' : 'Active'}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isDark ? 'text-white' : 'text-slate-900'}`}>            AI Insights Dashboard
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            AI-powered community analysis and anomaly detection
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAIData}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Bot className="w-4 h-4 mr-2" />
            Run Analysis
          </button>
        </div>
      </div>

      {/* AI Insights Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {insights.map((insight, index) => (
          <div key={index} className={`${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-black'} rounded-xl border p-6`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                {insight.type === 'engagement_pattern' && <Target className="w-5 h-5 text-blue-500 mr-2" />}
                {insight.type === 'sentiment_analysis' && <Brain className="w-5 h-5 text-green-500 mr-2" />}
                {insight.type === 'participation_forecast' && <Zap className="w-5 h-5 text-purple-500 mr-2" />}
              </div>
              <span className={`text-xs font-medium ${getImpactColor(insight.impact)}`}>
                {insight.impact.toUpperCase()} IMPACT
              </span>
            </div>

            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {insight.title}
            </h3>

            <p className={`text-sm mb-4 ${isDark ? 'text-white' : 'text-gray-600'}`}>
              {insight.description}
            </p>

            <div className="flex items-center justify-between">
              <div className={`flex items-center text-xs ${isDark ? 'text-white' : 'text-gray-500'}`}>
                <Brain className="w-3 h-3 mr-1" />
                {(insight.confidence * 100).toFixed(0)}% confidence
              </div>

              {insight.actionable && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-800'}`}>
                  Actionable
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sentiment Trend */}
      <ChartCard title="Community Sentiment Analysis">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sentimentTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="date" stroke="#6B7280" />
            <YAxis stroke="#6B7280" domain={[-1, 1]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#F9FAFB'
              }} 
            />
            <Area
              type="monotone"
              dataKey="positive"
              stackId="1"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="neutral"
              stackId="1"
              stroke="#6B7280"
              fill="#6B7280"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="negative"
              stackId="1"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Anomaly Detection */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-black'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Anomaly Detection
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                AI-detected unusual patterns requiring attention
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {anomalies.filter(a => !a.resolved_at).length} Active
              </span>
            </div>
          </div>
        </div>
        
        {anomalies.length === 0 && !loading ? (
          <EmptyState
            title="No anomalies detected"
            description="All community patterns appear normal"
            icon={Bot}
          />
        ) : (
          <DataTable
            data={anomalies}
            columns={anomalyColumns}
            loading={loading}
            emptyMessage="No anomalies detected"
            className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}
          />
        )}
      </div>

      {/* AI Model Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border p-6`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Model Performance
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Sentiment Analysis</span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>94.2% accuracy</span>
              </div>
              <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2`}>
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Topic Classification</span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>87.8% accuracy</span>
              </div>
              <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2`}>
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87.8%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Anomaly Detection</span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>91.5% accuracy</span>
              </div>
              <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2`}>
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '91.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border p-6`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Quick Actions
          </h3>

          <div className="space-y-3">
            <button className={`w-full text-left p-3 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'} transition-colors duration-200`}>
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-blue-500 mr-3" />
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Generate Engagement Report</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Comprehensive community analysis</div>
                </div>
              </div>
            </button>

            <button className={`w-full text-left p-3 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'} transition-colors duration-200`}>
              <div className="flex items-center">
                <Brain className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Retrain Models</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Update AI with latest data</div>
                </div>
              </div>
            </button>

            <button className={`w-full text-left p-3 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'} transition-colors duration-200`}>
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-3" />
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Configure Alerts</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Set up anomaly notifications</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}