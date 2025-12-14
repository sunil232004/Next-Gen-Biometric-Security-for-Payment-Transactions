import { Bot, Shield, BarChart, PieChart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function FreeToolsSection() {
  const { toast } = useToast();

  const handleToolClick = (title: string) => {
    toast({
      title: title,
      description: `${title} tool is loading...`,
    });
  };

  const freeTools = [
    {
      id: "credit-score",
      icon: <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center">
              <BarChart className="h-4 w-4 text-white" />
            </div>,
      title: "Check Credit Score",
      onClick: () => handleToolClick("Credit Score")
    },
    {
      id: "mutual-fund",
      icon: <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
              <PieChart className="h-4 w-4 text-white" />
            </div>,
      title: "Mutual Fund Report",
      onClick: () => handleToolClick("Mutual Fund Report")
    },
    {
      id: "ask-ai",
      icon: <Bot className="text-[#0d4bb5] h-6 w-6" />,
      title: "Ask AI",
      onClick: () => handleToolClick("AI Assistant")
    },
    {
      id: "insurance",
      icon: <Shield className="text-[#0d4bb5] h-6 w-6" />,
      title: "Insurance Status",
      onClick: () => handleToolClick("Insurance Status")
    }
  ];

  return (
    <div className="px-4 py-3 mt-1">
      <h2 className="font-semibold text-[#333333] mb-3">FREE TOOLS</h2>
      
      <div className="grid grid-cols-4 gap-4">
        {freeTools.map((tool) => (
          <div 
            key={tool.id} 
            className="flex flex-col items-center cursor-pointer"
            onClick={tool.onClick}
          >
            <div className="bg-white p-2 rounded-lg shadow-sm mb-2 w-14 h-14 flex items-center justify-center hover:bg-gray-50">
              {tool.icon}
            </div>
            <span className="text-xs text-center whitespace-pre-line">
              {tool.title.replace(/ /g, '\n')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
