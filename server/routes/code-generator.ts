import { RequestHandler } from "express";

interface GenerationRequest {
  prompt: string;
  language: string;
  framework?: string;
  complexity: "simple" | "intermediate" | "advanced";
  variables?: { [key: string]: string };
}

interface GenerationResponse {
  success: boolean;
  code: string;
  explanation: string;
  files?: { name: string; content: string }[];
  error?: string;
}

// Enhanced code templates with proper structure
const codeTemplates = {
  javascript: {
    react: (prompt: string, variables: any = {}) => ({
      code: `import React, { useState, useEffect } from 'react';
import './styles.css';

/**
 * ${prompt}
 * Generated React component with state management
 */
const ${prompt.replace(/\s+/g, "")}Component = ({ 
  title = "${prompt}",
  onAction,
  ...props 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Variables from user input
  ${Object.entries(variables)
    .map(([key, value]) => `const ${key} = "${value}";`)
    .join("\n  ")}

  useEffect(() => {
    // Initialize component
    console.log('Component mounted: ${prompt}');
  }, []);

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ${prompt} - implementation
      setIsActive(!isActive);
      
      if (onAction) {
        await onAction({ isActive, data });
      }
      
      console.log('Action completed successfully');
    } catch (err) {
      setError('Action failed: ' + err.message);
      console.error('Action error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setData(null);
    setError(null);
  };

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={handleReset}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="component-container" {...props}>
      <header className="component-header">
        <h1>{title}</h1>
        <span className={isActive ? 'status-active' : 'status-inactive'}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </header>
      
      <main className="component-content">
        <div className="action-section">
          <button 
            onClick={handleAction} 
            disabled={loading}
            className="primary-button"
          >
            {loading ? 'Processing...' : 'Trigger Action'}
          </button>
          
          <button 
            onClick={handleReset}
            className="secondary-button"
          >
            Reset
          </button>
        </div>
        
        {data && (
          <div className="data-display">
            <h3>Data</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default ${prompt.replace(/\s+/g, "")}Component;`,
      styles: `.component-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: white;
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.component-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.status-active {
  color: #28a745;
  font-weight: bold;
}

.status-inactive {
  color: #6c757d;
  font-weight: bold;
}

.action-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.primary-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.primary-button:hover {
  background: #0056b3;
}

.primary-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.secondary-button {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.secondary-button:hover {
  background: #007bff;
  color: white;
}

.data-display {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.data-display h3 {
  margin-top: 0;
  color: #495057;
}

.data-display pre {
  background: white;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.error-container {
  text-align: center;
  padding: 40px;
  color: #dc3545;
}

.error-container h3 {
  margin-bottom: 15px;
}

.error-container button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
`,
    }),

    node: (prompt: string, variables: any = {}) => ({
      code: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * ${prompt}
 * Express.js server implementation
 */

const app = express();
const PORT = process.env.PORT || 3000;

// Variables from user input
${Object.entries(variables)
  .map(([key, value]) => `const ${key} = "${value}";`)
  .join("\n")}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '${prompt}',
    status: 'active',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.post('/api/action', async (req, res) => {
  try {
    const { data } = req.body;
    
    // ${prompt} - implementation
    console.log('Processing action:', data);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = {
      success: true,
      data: {
        processed: data,
        timestamp: new Date().toISOString(),
        result: 'Action completed successfully'
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Action error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/data', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  // Mock data generation
  const mockData = Array.from({ length: parseInt(limit) }, (_, i) => ({
    id: (parseInt(page) - 1) * parseInt(limit) + i + 1,
    name: \`Item \${i + 1}\`,
    description: '${prompt}',
    createdAt: new Date().toISOString()
  }));
  
  res.json({
    data: mockData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 100
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📝 Purpose: \${prompt}\`);
  console.log(\`🌍 Environment: \${process.env.NODE_ENV || 'development'}\`);
});

module.exports = app;`,
    }),

    vanilla: (prompt: string, variables: any = {}) => ({
      code: `/**
 * ${prompt}
 * Vanilla JavaScript implementation
 */

// Variables from user input
${Object.entries(variables)
  .map(([key, value]) => `const ${key} = "${value}";`)
  .join("\n")}

class ${prompt.replace(/\s+/g, "")}Manager {
  constructor(options = {}) {
    this.options = { ...this.defaultOptions, ...options };
    this.state = {
      isActive: false,
      data: null,
      error: null,
      loading: false
    };
    
    this.init();
  }
  
  get defaultOptions() {
    return {
      autoInit: true,
      debug: false,
      timeout: 5000
    };
  }
  
  init() {
    if (this.options.debug) {
      console.log('Initializing ${prompt}Manager');
    }
    
    this.setupEventListeners();
    
    if (this.options.autoInit) {
      this.start();
    }
  }
  
  setupEventListeners() {
    // Add event listeners if running in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }
  
  async start() {
    try {
      this.setState({ loading: true, error: null });
      
      // ${prompt} - main implementation
      await this.performAction();
      
      this.setState({ 
        isActive: true, 
        loading: false,
        data: { initialized: true, timestamp: Date.now() }
      });
      
      this.log('Started successfully');
    } catch (error) {
      this.setState({ 
        loading: false, 
        error: error.message 
      });
      this.log('Start failed:', error);
    }
  }
  
  async performAction() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({ success: true });
        } else {
          reject(new Error('Random failure for demo'));
        }
      }, 1000);
    });
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.emit('stateChange', this.state);
  }
  
  getState() {
    return { ...this.state };
  }
  
  async stop() {
    try {
      this.setState({ loading: true });
      
      // Cleanup operations
      await this.cleanup();
      
      this.setState({ 
        isActive: false, 
        loading: false,
        data: null
      });
      
      this.log('Stopped successfully');
    } catch (error) {
      this.setState({ 
        loading: false, 
        error: error.message 
      });
      this.log('Stop failed:', error);
    }
  }
  
  async cleanup() {
    // Cleanup resources
    this.log('Cleaning up resources');
  }
  
  emit(event, data) {
    if (this.options.debug) {
      console.log(\`Event: \${event}\`, data);
    }
    
    // Basic event system
    const eventName = \`on\${event.charAt(0).toUpperCase()}\${event.slice(1)}\`;
    if (typeof this[eventName] === 'function') {
      this[eventName](data);
    }
  }
  
  log(...args) {
    if (this.options.debug) {
      console.log('[${prompt}Manager]', ...args);
    }
  }
  
  // Public API methods
  toggle() {
    return this.state.isActive ? this.stop() : this.start();
  }
  
  reset() {
    this.setState({
      isActive: false,
      data: null,
      error: null,
      loading: false
    });
  }
  
  configure(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
}

// Usage example
const manager = new ${prompt.replace(/\s+/g, "")}Manager({
  debug: true,
  autoInit: true
});

// Event handlers
manager.onStateChange = (state) => {
  console.log('State changed:', state);
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${prompt.replace(/\s+/g, "")}Manager;
} else if (typeof window !== 'undefined') {
  window.${prompt.replace(/\s+/g, "")}Manager = ${prompt.replace(/\s+/g, "")}Manager;
}`,
    }),
  },

  python: {
    default: (prompt: string, variables: any = {}) => ({
      code: `#!/usr/bin/env python3
"""
${prompt}
Python implementation with class-based structure
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional, List

# Variables from user input
${Object.entries(variables)
  .map(([key, value]) => `${key.toUpperCase()} = "${value}"`)
  .join("\n")}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ${prompt.replace(/\s+/g, "")}Manager:
    """
    ${prompt}
    Main manager class for handling operations
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = {
            'debug': False,
            'timeout': 5.0,
            'max_retries': 3,
            'auto_start': True,
            **(config or {})
        }
        
        self.state = {
            'is_active': False,
            'data': None,
            'error': None,
            'loading': False,
            'start_time': None
        }
        
        self._observers = []
        
        if self.config['auto_start']:
            asyncio.create_task(self.start())
    
    def add_observer(self, callback):
        """Add state change observer"""
        self._observers.append(callback)
    
    def _notify_observers(self):
        """Notify all observers of state change"""
        for callback in self._observers:
            try:
                callback(self.state.copy())
            except Exception as e:
                logger.error(f"Observer notification failed: {e}")
    
    def _update_state(self, **kwargs):
        """Update state and notify observers"""
        self.state.update(kwargs)
        self._notify_observers()
        
        if self.config['debug']:
            logger.debug(f"State updated: {kwargs}")
    
    async def start(self):
        """Start the main operation"""
        try:
            self._update_state(loading=True, error=None)
            logger.info("Starting ${prompt}")
            
            # ${prompt} - main implementation
            result = await self._perform_operation()
            
            self._update_state(
                is_active=True,
                loading=False,
                data=result,
                start_time=datetime.now().isoformat()
            )
            
            logger.info("Started successfully")
            return result
            
        except Exception as e:
            error_msg = f"Start failed: {str(e)}"
            self._update_state(loading=False, error=error_msg)
            logger.error(error_msg)
            raise
    
    async def _perform_operation(self) -> Dict[str, Any]:
        """Perform the main operation with retry logic"""
        last_exception = None
        
        for attempt in range(self.config['max_retries']):
            try:
                logger.info(f"Performing operation (attempt {attempt + 1})")
                
                # Simulate async operation
                await asyncio.sleep(0.1)
                
                # Main logic implementation
                result = {
                    'status': 'success',
                    'timestamp': datetime.now().isoformat(),
                    'attempt': attempt + 1,
                    'operation': '${prompt}',
                    'data': self._generate_sample_data()
                }
                
                return result
                
            except Exception as e:
                last_exception = e
                if attempt < self.config['max_retries'] - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Operation failed (attempt {attempt + 1}), retrying in {wait_time}s: {e}")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Operation failed after {self.config['max_retries']} attempts: {e}")
        
        raise last_exception or Exception("Operation failed")
    
    def _generate_sample_data(self) -> List[Dict[str, Any]]:
        """Generate sample data for demonstration"""
        return [
            {
                'id': i,
                'name': f'Item {i}',
                'description': '${prompt}',
                'created_at': datetime.now().isoformat(),
                'active': i % 2 == 0
            }
            for i in range(1, 6)
        ]
    
    async def stop(self):
        """Stop the operation and cleanup"""
        try:
            self._update_state(loading=True)
            logger.info("Stopping ${prompt}")
            
            await self._cleanup()
            
            self._update_state(
                is_active=False,
                loading=False,
                data=None,
                start_time=None
            )
            
            logger.info("Stopped successfully")
            
        except Exception as e:
            error_msg = f"Stop failed: {str(e)}"
            self._update_state(loading=False, error=error_msg)
            logger.error(error_msg)
            raise
    
    async def _cleanup(self):
        """Cleanup resources"""
        # Add cleanup logic here
        await asyncio.sleep(0.1)  # Simulate cleanup
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status"""
        return {
            'state': self.state.copy(),
            'config': self.config.copy(),
            'uptime': self._get_uptime()
        }
    
    def _get_uptime(self) -> Optional[float]:
        """Get uptime in seconds"""
        if not self.state['start_time']:
            return None
        
        start_time = datetime.fromisoformat(self.state['start_time'])
        return (datetime.now() - start_time).total_seconds()
    
    async def toggle(self):
        """Toggle between start and stop"""
        if self.state['is_active']:
            await self.stop()
        else:
            await self.start()
    
    def reset(self):
        """Reset to initial state"""
        self._update_state(
            is_active=False,
            data=None,
            error=None,
            loading=False,
            start_time=None
        )


async def main():
    """Main entry point"""
    logger.info("Starting ${prompt} application")
    
    # Create manager instance
    manager = ${prompt.replace(/\s+/g, "")}Manager({
        'debug': True,
        'auto_start': False
    })
    
    # Add observer to log state changes
    manager.add_observer(lambda state: logger.info(f"State: {state}"))
    
    try:
        # Start the manager
        await manager.start()
        
        # Simulate some work
        await asyncio.sleep(2)
        
        # Get status
        status = manager.get_status()
        print(json.dumps(status, indent=2))
        
        # Stop the manager
        await manager.stop()
        
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
        await manager.stop()
    except Exception as e:
        logger.error(f"Application error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())`,
    }),
  },

  typescript: {
    react: (prompt: string, variables: any = {}) => ({
      code: `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ReactNode } from 'react';

/**
 * ${prompt}
 * TypeScript React component with full type safety
 */

// Types and interfaces
interface ${prompt.replace(/\s+/g, "")}Props {
  title?: string;
  className?: string;
  onAction?: (data: ActionData) => Promise<void> | void;
  onStateChange?: (state: ComponentState) => void;
  children?: ReactNode;
  autoStart?: boolean;
  debug?: boolean;
}

interface ComponentState {
  isActive: boolean;
  loading: boolean;
  error: string | null;
  data: any;
  timestamp: string | null;
}

interface ActionData {
  isActive: boolean;
  data: any;
  timestamp: string;
}

// Variables from user input
${Object.entries(variables)
  .map(([key, value]) => `const ${key}: string = "${value}";`)
  .join("\n")}

// Custom hooks
const use${prompt.replace(/\s+/g, "")}Manager = (autoStart: boolean = false) => {
  const [state, setState] = useState<ComponentState>({
    isActive: false,
    loading: false,
    error: null,
    data: null,
    timestamp: null,
  });

  const updateState = useCallback((updates: Partial<ComponentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const performAction = useCallback(async (): Promise<ActionData> => {
    updateState({ loading: true, error: null });

    try {
      // ${prompt} - implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const actionData: ActionData = {
        isActive: !state.isActive,
        data: { 
          result: 'success',
          timestamp: new Date().toISOString(),
          operation: '${prompt}'
        },
        timestamp: new Date().toISOString(),
      };

      updateState({
        isActive: actionData.isActive,
        data: actionData.data,
        timestamp: actionData.timestamp,
        loading: false,
      });

      return actionData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateState({ loading: false, error: errorMessage });
      throw error;
    }
  }, [state.isActive, updateState]);

  const reset = useCallback(() => {
    updateState({
      isActive: false,
      loading: false,
      error: null,
      data: null,
      timestamp: null,
    });
  }, [updateState]);

  useEffect(() => {
    if (autoStart) {
      performAction().catch(console.error);
    }
  }, [autoStart, performAction]);

  return {
    state,
    actions: {
      performAction,
      reset,
    },
  };
};

// Main component
const ${prompt.replace(/\s+/g, "")}Component: React.FC<${prompt.replace(/\s+/g, "")}Props> = ({
  title = "${prompt}",
  className = "",
  onAction,
  onStateChange,
  children,
  autoStart = false,
  debug = false,
}) => {
  const { state, actions } = use${prompt.replace(/\s+/g, "")}Manager(autoStart);

  // Memoized values
  const statusText = useMemo(() => {
    if (state.loading) return 'Processing...';
    if (state.error) return 'Error';
    if (state.isActive) return 'Active';
    return 'Inactive';
  }, [state.loading, state.error, state.isActive]);

  const statusColor = useMemo(() => {
    if (state.loading) return 'text-blue-500';
    if (state.error) return 'text-red-500';
    if (state.isActive) return 'text-green-500';
    return 'text-gray-500';
  }, [state.loading, state.error, state.isActive]);

  // Effect for state change notifications
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('${prompt}Component state:', state);
    }
  }, [state, debug]);

  // Action handler
  const handleAction = async () => {
    try {
      const actionData = await actions.performAction();
      
      if (onAction) {
        await onAction(actionData);
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  // Error boundary fallback
  if (state.error) {
    return (
      <div className={\`error-container \${className}\`}>
        <div className="error-content">
          <h3 className="text-red-600 text-lg font-semibold">Error</h3>
          <p className="text-red-500 mt-2">{state.error}</p>
          <button 
            onClick={actions.reset}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={\`component-container \${className}\`}>
      <header className="component-header">
        <div className="header-content">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <span className={\`status-badge \${statusColor}\`}>
            {statusText}
          </span>
        </div>
        {state.timestamp && (
          <div className="timestamp text-sm text-gray-500">
            Last updated: {new Date(state.timestamp).toLocaleString()}
          </div>
        )}
      </header>

      <main className="component-content">
        <div className="action-section">
          <button
            onClick={handleAction}
            disabled={state.loading}
            className={\`primary-button \${
              state.loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white px-6 py-2 rounded transition-colors\`}
          >
            {state.loading ? 'Processing...' : 'Trigger Action'}
          </button>

          <button
            onClick={actions.reset}
            disabled={state.loading}
            className="secondary-button border border-blue-500 text-blue-500 px-6 py-2 rounded hover:bg-blue-50 transition-colors"
          >
            Reset
          </button>
        </div>

        {state.data && (
          <div className="data-section mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Data</h3>
            <div className="data-display bg-gray-50 rounded p-4 border">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(state.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {children && (
          <div className="children-section mt-6">
            {children}
          </div>
        )}

        {debug && (
          <div className="debug-section mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Debug Info</h4>
            <pre className="text-xs text-yellow-700">
              {JSON.stringify({ state, variables: { ${Object.keys(variables).join(", ")} } }, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};

// Export types for external use
export type { ${prompt.replace(/\s+/g, "")}Props, ComponentState, ActionData };

export default ${prompt.replace(/\s+/g, "")}Component;`,
    }),
  },
};

export const generateCode: RequestHandler = async (req, res) => {
  try {
    const {
      prompt,
      language,
      framework,
      complexity,
      variables = {},
    }: GenerationRequest = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        error: "Language is required",
      });
    }

    // Get the appropriate template
    const langTemplates = codeTemplates[language as keyof typeof codeTemplates];
    if (!langTemplates) {
      return res.status(400).json({
        success: false,
        error: `Language "${language}" is not supported`,
      });
    }

    // Generate code based on framework or default
    const templateKey =
      framework && (langTemplates as any)[framework] ? framework : "default";
    const template =
      (langTemplates as any)[templateKey] || (langTemplates as any)["default"];

    if (!template) {
      return res.status(400).json({
        success: false,
        error: `Template not found for ${language}${framework ? ` with ${framework}` : ""}`,
      });
    }

    // Generate the code
    const result = template(prompt, variables);

    // Prepare response
    const response: GenerationResponse = {
      success: true,
      code: result.code || result,
      explanation:
        `Generated ${language}${framework ? ` ${framework}` : ""} code for: "${prompt}". ` +
        `This implementation includes proper error handling, type safety${language === "typescript" ? " with full TypeScript support" : ""}, ` +
        `and follows best practices for ${complexity} complexity level.`,
      files: [],
    };

    // Add files
    const fileExtension =
      language === "javascript"
        ? "js"
        : language === "typescript"
          ? "ts"
          : language === "python"
            ? "py"
            : "txt";

    response.files = [
      {
        name: `${prompt.replace(/\s+/g, "_").toLowerCase()}.${fileExtension}`,
        content: response.code,
      },
    ];

    // Add additional files for specific frameworks
    if (framework === "react" && result.styles) {
      response.files.push({
        name: "styles.css",
        content: result.styles,
      });
    }

    res.json(response);
  } catch (error: any) {
    console.error("Code generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};
