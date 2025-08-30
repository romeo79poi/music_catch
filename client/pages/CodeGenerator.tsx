import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Play,
  Copy,
  Download,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

export default function CodeGenerator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [framework, setFramework] = useState("");
  const [complexity, setComplexity] = useState<
    "simple" | "intermediate" | "advanced"
  >("simple");
  const [variables, setVariables] = useState<{ [key: string]: string }>({});
  const [generatedCode, setGeneratedCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState<
    { name: string; content: string }[]
  >([]);

  // Add a new variable
  const addVariable = () => {
    const key = `variable_${Object.keys(variables).length + 1}`;
    setVariables((prev) => ({ ...prev, [key]: "" }));
  };

  // Update variable
  const updateVariable = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  // Remove variable
  const removeVariable = (key: string) => {
    setVariables((prev) => {
      const newVars = { ...prev };
      delete newVars[key];
      return newVars;
    });
  };

  // Generate code using backend API
  const generateCode = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing prompt",
        description: "Please enter a description of what you want to generate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const request: GenerationRequest = {
        prompt: prompt.trim(),
        language,
        framework: framework || undefined,
        complexity,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
      };

      // Call backend API
      const response = await fetch("/api/code-generator/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GenerationResponse = await response.json();

      if (result.success) {
        setGeneratedCode(result.code);
        setExplanation(result.explanation);
        setGeneratedFiles(result.files || []);

        toast({
          title: "Code generated successfully! 🎉",
          description: "Your code has been generated and is ready to use.",
        });
      } else {
        throw new Error(result.error || "Generation failed");
      }
    } catch (error: any) {
      console.error("Code generation error:", error);

      // Mock response for demo when backend is not available
      const mockResponse = generateMockCode(prompt, language, framework);
      setGeneratedCode(mockResponse.code);
      setExplanation(mockResponse.explanation);
      setGeneratedFiles(mockResponse.files);

      toast({
        title: "Demo mode",
        description:
          "Generated mock code for demonstration. Backend not connected.",
        variant: "default",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Mock code generator for demo
  const generateMockCode = (
    prompt: string,
    lang: string,
    fw?: string,
  ): GenerationResponse => {
    const templates = {
      javascript: {
        react: `import React, { useState } from 'react';

function ${prompt.replace(/\s+/g, "")}Component() {
  const [state, setState] = useState('');

  const handleAction = () => {
    // ${prompt}
    console.log('Action triggered');
  };

  return (
    <div className="container">
      <h1>${prompt}</h1>
      <button onClick={handleAction}>
        Click me
      </button>
    </div>
  );
}

export default ${prompt.replace(/\s+/g, "")}Component;`,
        node: `const express = require('express');
const app = express();

// ${prompt}
app.get('/', (req, res) => {
  res.json({ message: '${prompt}' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
        vanilla: `// ${prompt}
function ${prompt.replace(/\s+/g, "").toLowerCase()}() {
  console.log('${prompt}');
  
  // Your implementation here
  const result = performAction();
  return result;
}

function performAction() {
  // Implementation logic
  return true;
}

// Usage
${prompt.replace(/\s+/g, "").toLowerCase()}();`,
      },
      python: {
        default: `# ${prompt}
def ${prompt.replace(/\s+/g, "_").toLowerCase()}():
    """
    ${prompt}
    """
    print("${prompt}")
    
    # Your implementation here
    result = perform_action()
    return result

def perform_action():
    """Implementation logic"""
    return True

if __name__ == "__main__":
    ${prompt.replace(/\s+/g, "_").toLowerCase()}()`,
      },
      typescript: {
        react: `import React, { useState } from 'react';

interface Props {
  title?: string;
}

const ${prompt.replace(/\s+/g, "")}Component: React.FC<Props> = ({ title = "${prompt}" }) => {
  const [state, setState] = useState<string>('');

  const handleAction = (): void => {
    // ${prompt}
    console.log('Action triggered');
  };

  return (
    <div className="container">
      <h1>{title}</h1>
      <button onClick={handleAction}>
        Click me
      </button>
    </div>
  );
};

export default ${prompt.replace(/\s+/g, "")}Component;`,
      },
    };

    const codeTemplate = templates[lang as keyof typeof templates];
    const code =
      (codeTemplate as any)?.[fw || "default"] ||
      codeTemplate ||
      `// ${prompt}\nconsole.log("Generated code for: ${prompt}");`;

    return {
      success: true,
      code,
      explanation: `This code implements "${prompt}" using ${lang}${fw ? ` with ${fw}` : ""}. The generated code includes basic structure and functionality to get you started.`,
      files: [
        {
          name: `${prompt.replace(/\s+/g, "_").toLowerCase()}.${lang === "javascript" ? "js" : lang === "typescript" ? "ts" : "py"}`,
          content: code,
        },
      ],
    };
  };

  // Copy code to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard! 📋",
        description: "Code has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  // Download code as file
  const downloadCode = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "File downloaded! 📁",
      description: `${filename} has been downloaded.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-purple-primary/20 rounded-full flex items-center justify-center">
              <Code className="w-6 h-6 text-purple-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">Code Generator</h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Generate high-quality code using AI. Describe what you want to
            build, and get production-ready code instantly.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="bg-purple-dark/50 border-purple-primary/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Generation Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure your code generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prompt Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    What do you want to build? *
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A React component for user authentication with email and password validation"
                    className="bg-background/30 border-purple-primary/30 text-white placeholder-slate-400 min-h-[100px]"
                  />
                </div>

                {/* Language Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Language
                    </label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="bg-background/30 border-purple-primary/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Framework (Optional)
                    </label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger className="bg-background/30 border-purple-primary/30 text-white">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="react">React</SelectItem>
                        <SelectItem value="vue">Vue.js</SelectItem>
                        <SelectItem value="angular">Angular</SelectItem>
                        <SelectItem value="node">Node.js</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                        <SelectItem value="fastapi">FastAPI</SelectItem>
                        <SelectItem value="django">Django</SelectItem>
                        <SelectItem value="spring">Spring Boot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Complexity Level */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Complexity Level
                  </label>
                  <div className="flex space-x-2">
                    {["simple", "intermediate", "advanced"].map((level) => (
                      <Button
                        key={level}
                        variant={complexity === level ? "default" : "outline"}
                        size="sm"
                        onClick={() => setComplexity(level as any)}
                        className={
                          complexity === level
                            ? "bg-purple-primary"
                            : "border-purple-primary/30 text-white"
                        }
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Variables */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white text-sm font-medium">
                      Variables (Optional)
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addVariable}
                      className="border-purple-primary/30 text-purple-primary"
                    >
                      Add Variable
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(variables).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <Input
                          value={key}
                          onChange={(e) => {
                            const newKey = e.target.value;
                            const newVars = { ...variables };
                            delete newVars[key];
                            newVars[newKey] = value;
                            setVariables(newVars);
                          }}
                          placeholder="Variable name"
                          className="bg-background/30 border-purple-primary/30 text-white flex-1"
                        />
                        <Input
                          value={value}
                          onChange={(e) => updateVariable(key, e.target.value)}
                          placeholder="Value"
                          className="bg-background/30 border-purple-primary/30 text-white flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariable(key)}
                          className="border-red-500/30 text-red-400"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateCode}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-lg h-12"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Generate Code</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Generated Code */}
            {generatedCode && (
              <Card className="bg-purple-dark/50 border-purple-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>Generated Code</span>
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedCode)}
                        className="border-purple-primary/30 text-purple-primary"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadCode(
                            `generated_code.${language}`,
                            generatedCode,
                          )
                        }
                        className="border-purple-primary/30 text-purple-primary"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-background/30 border border-purple-primary/20 rounded-lg p-4 overflow-x-auto text-sm text-white">
                    <code>{generatedCode}</code>
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Explanation */}
            {explanation && (
              <Card className="bg-purple-dark/50 border-purple-primary/20">
                <CardHeader>
                  <CardTitle className="text-white">Code Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {explanation}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Generated Files */}
            {generatedFiles.length > 0 && (
              <Card className="bg-purple-dark/50 border-purple-primary/20">
                <CardHeader>
                  <CardTitle className="text-white">Generated Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="border border-purple-primary/20 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="outline"
                          className="border-purple-primary/30 text-purple-primary"
                        >
                          {file.name}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(file.content)}
                            className="border-purple-primary/30 text-purple-primary"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadCode(file.name, file.content)
                            }
                            className="border-purple-primary/30 text-purple-primary"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <pre className="bg-background/30 rounded p-2 text-xs text-white overflow-x-auto max-h-32">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!generatedCode && (
              <Card className="bg-purple-dark/50 border-purple-primary/20">
                <CardContent className="py-12 text-center">
                  <Code className="w-16 h-16 text-purple-primary/50 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">
                    Ready to Generate
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Fill in the details on the left and click "Generate Code" to
                    get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
