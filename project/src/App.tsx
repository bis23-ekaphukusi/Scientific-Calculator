import React, { useState, useEffect, useCallback } from 'react';
import { History, Calculator, MousePointerClick as RotateCounterClockwise } from 'lucide-react';

interface HistoryEntry {
  expression: string;
  result: string;
}

function App() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleNumber = useCallback((num: string) => {
    if (isError) {
      setDisplay('0');
      setIsError(false);
    }
    
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForNewValue, isError]);

  const handleDecimal = useCallback(() => {
    if (isError) {
      setDisplay('0.');
      setIsError(false);
      return;
    }
    
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  }, [display, waitingForNewValue, isError]);

  const calculate = useCallback((firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '*': return firstValue * secondValue;
      case '/': 
        if (secondValue === 0) throw new Error('Division by zero');
        return firstValue / secondValue;
      case '^': return Math.pow(firstValue, secondValue);
      default: return secondValue;
    }
  }, []);

  const handleOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      try {
        const newValue = calculate(currentValue, inputValue, operation);
        setDisplay(String(newValue));
        setPreviousValue(newValue);
        
        setHistory(prev => [{
          expression: `${currentValue} ${operation} ${inputValue}`,
          result: String(newValue)
        }, ...prev.slice(0, 9)]);
      } catch (error) {
        setDisplay('Error');
        setIsError(true);
        setPreviousValue(null);
        setOperation(null);
        return;
      }
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation, calculate]);

  const handleEquals = useCallback(() => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      try {
        const newValue = calculate(previousValue, inputValue, operation);
        setDisplay(String(newValue));
        
        setHistory(prev => [{
          expression: `${previousValue} ${operation} ${inputValue}`,
          result: String(newValue)
        }, ...prev.slice(0, 9)]);
        
        setPreviousValue(null);
        setOperation(null);
        setWaitingForNewValue(true);
      } catch (error) {
        setDisplay('Error');
        setIsError(true);
        setPreviousValue(null);
        setOperation(null);
      }
    }
  }, [display, previousValue, operation, calculate]);

  const handleScientific = useCallback((func: string) => {
    const inputValue = parseFloat(display);
    let result: number;

    try {
      switch (func) {
        case 'sin': result = Math.sin(inputValue); break;
        case 'cos': result = Math.cos(inputValue); break;
        case 'tan': result = Math.tan(inputValue); break;
        case 'log': result = Math.log10(inputValue); break;
        case 'ln': result = Math.log(inputValue); break;
        case 'sqrt': 
          if (inputValue < 0) throw new Error('Invalid input');
          result = Math.sqrt(inputValue); 
          break;
        case '!':
          if (inputValue < 0 || !Number.isInteger(inputValue)) throw new Error('Invalid input');
          result = factorial(inputValue);
          break;
        case '1/x':
          if (inputValue === 0) throw new Error('Division by zero');
          result = 1 / inputValue;
          break;
        case 'x²': result = inputValue * inputValue; break;
        case 'π': result = Math.PI; break;
        case 'e': result = Math.E; break;
        default: return;
      }

      setDisplay(String(result));
      setHistory(prev => [{
        expression: `${func}(${inputValue})`,
        result: String(result)
      }, ...prev.slice(0, 9)]);
      setWaitingForNewValue(true);
    } catch (error) {
      setDisplay('Error');
      setIsError(true);
    }
  }, [display]);

  const factorial = (n: number): number => {
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
  };

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
    setIsError(false);
  }, []);

  const handleAllClear = useCallback(() => {
    handleClear();
    setMemory(0);
    setHistory([]);
  }, [handleClear]);

  const handleMemory = useCallback((func: string) => {
    const inputValue = parseFloat(display);
    
    switch (func) {
      case 'MC': setMemory(0); break;
      case 'MR': setDisplay(String(memory)); setWaitingForNewValue(true); break;
      case 'MS': setMemory(inputValue); break;
      case 'M+': setMemory(memory + inputValue); break;
      case 'M-': setMemory(memory - inputValue); break;
    }
  }, [display, memory]);

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      event.preventDefault();
      
      if (event.key >= '0' && event.key <= '9') {
        handleNumber(event.key);
      } else if (event.key === '.') {
        handleDecimal();
      } else if (['+', '-', '*', '/'].includes(event.key)) {
        handleOperation(event.key);
      } else if (event.key === 'Enter' || event.key === '=') {
        handleEquals();
      } else if (event.key === 'Escape') {
        handleClear();
      } else if (event.key === 'Backspace') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [display, handleNumber, handleDecimal, handleOperation, handleEquals, handleClear]);

  const Button = ({ onClick, className = '', children, ...props }: any) => (
    <button
      onClick={onClick}
      className={`
        relative h-12 rounded-xl font-semibold text-sm
        transition-all duration-200 ease-out
        hover:scale-105 hover:shadow-lg
        active:scale-95 active:shadow-sm
        backdrop-blur-sm border border-white/10
        ${className}
      `}
      {...props}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
      <span className="relative z-10">{children}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex gap-6">
        {/* Calculator */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calculator className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-bold text-white">Scientific</h1>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <History className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Display */}
            <div className="bg-black/60 rounded-2xl p-6 mb-6 border border-white/5">
              <div className="text-right">
                <div className="text-gray-400 text-sm mb-1">
                  {operation && previousValue !== null ? `${previousValue} ${operation}` : ''}
                </div>
                <div className={`text-3xl font-mono font-bold ${isError ? 'text-red-400' : 'text-white'}`}>
                  {display}
                </div>
                {memory !== 0 && (
                  <div className="text-blue-400 text-xs mt-2">M: {memory}</div>
                )}
              </div>
            </div>

            {/* Memory & Clear Row */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <Button onClick={() => handleMemory('MC')} className="bg-orange-600/80 hover:bg-orange-600 text-white">
                MC
              </Button>
              <Button onClick={() => handleMemory('MR')} className="bg-orange-600/80 hover:bg-orange-600 text-white">
                MR
              </Button>
              <Button onClick={() => handleMemory('MS')} className="bg-orange-600/80 hover:bg-orange-600 text-white">
                MS
              </Button>
              <Button onClick={() => handleMemory('M+')} className="bg-orange-600/80 hover:bg-orange-600 text-white">
                M+
              </Button>
              <Button onClick={() => handleMemory('M-')} className="bg-orange-600/80 hover:bg-orange-600 text-white">
                M-
              </Button>
            </div>

            {/* Scientific Functions Row 1 */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <Button onClick={() => handleScientific('sin')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                sin
              </Button>
              <Button onClick={() => handleScientific('cos')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                cos
              </Button>
              <Button onClick={() => handleScientific('tan')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                tan
              </Button>
              <Button onClick={() => handleScientific('log')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                log
              </Button>
              <Button onClick={() => handleScientific('ln')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                ln
              </Button>
            </div>

            {/* Scientific Functions Row 2 */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <Button onClick={() => handleScientific('!')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                x!
              </Button>
              <Button onClick={() => handleScientific('1/x')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                1/x
              </Button>
              <Button onClick={() => handleScientific('x²')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                x²
              </Button>
              <Button onClick={() => handleScientific('sqrt')} className="bg-purple-600/80 hover:bg-purple-600 text-white">
                √x
              </Button>
              <Button onClick={() => handleOperation('^')} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                x^y
              </Button>
            </div>

            {/* Constants & Clear Row */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <Button onClick={() => handleScientific('π')} className="bg-green-600/80 hover:bg-green-600 text-white">
                π
              </Button>
              <Button onClick={() => handleScientific('e')} className="bg-green-600/80 hover:bg-green-600 text-white">
                e
              </Button>
              <Button onClick={handleClear} className="bg-red-600/80 hover:bg-red-600 text-white">
                C
              </Button>
              <Button onClick={handleAllClear} className="bg-red-600/80 hover:bg-red-600 text-white">
                AC
              </Button>
              <Button 
                onClick={() => {
                  if (display.length > 1) {
                    setDisplay(display.slice(0, -1));
                  } else {
                    setDisplay('0');
                  }
                }}
                className="bg-gray-600/80 hover:bg-gray-600 text-white"
              >
                ⌫
              </Button>
            </div>

            {/* Main Calculator Grid */}
            <div className="grid grid-cols-4 gap-3">
              {/* Row 1 */}
              <Button onClick={() => handleNumber('7')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                7
              </Button>
              <Button onClick={() => handleNumber('8')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                8
              </Button>
              <Button onClick={() => handleNumber('9')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                9
              </Button>
              <Button onClick={() => handleOperation('/')} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                ÷
              </Button>

              {/* Row 2 */}
              <Button onClick={() => handleNumber('4')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                4
              </Button>
              <Button onClick={() => handleNumber('5')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                5
              </Button>
              <Button onClick={() => handleNumber('6')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                6
              </Button>
              <Button onClick={() => handleOperation('*')} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                ×
              </Button>

              {/* Row 3 */}
              <Button onClick={() => handleNumber('1')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                1
              </Button>
              <Button onClick={() => handleNumber('2')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                2
              </Button>
              <Button onClick={() => handleNumber('3')} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                3
              </Button>
              <Button onClick={() => handleOperation('-')} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                −
              </Button>

              {/* Row 4 */}
              <Button onClick={() => handleNumber('0')} className="bg-gray-700/80 hover:bg-gray-700 text-white col-span-2">
                0
              </Button>
              <Button onClick={handleDecimal} className="bg-gray-700/80 hover:bg-gray-700 text-white">
                .
              </Button>
              <Button onClick={() => handleOperation('+')} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                +
              </Button>

              {/* Equals */}
              <Button onClick={handleEquals} className="bg-green-600/80 hover:bg-green-600 text-white col-span-4 h-12">
                =
              </Button>
            </div>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="w-80 bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">History</h2>
              <button
                onClick={() => setHistory([])}
                className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 transition-colors"
              >
                <RotateCounterClockwise className="w-4 h-4 text-red-400" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No calculations yet</p>
              ) : (
                history.map((entry, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setDisplay(entry.result);
                      setWaitingForNewValue(true);
                    }}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors"
                  >
                    <div className="text-gray-300 text-sm">{entry.expression}</div>
                    <div className="text-white font-mono">{entry.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;