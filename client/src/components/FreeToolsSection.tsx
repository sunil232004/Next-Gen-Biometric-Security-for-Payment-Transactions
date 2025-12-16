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
      icon: <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center">
              <BarChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>,
      title: "Check Credit Score",
      onClick: () => handleToolClick("Credit Score")
    },
    {
      id: "mutual-fund",
      icon: <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
              <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
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
    <div className="px-3 sm:px-4 py-2.5 sm:py-3 mt-1">
      <h2 className="font-semibold text-[#333333] text-sm sm:text-base mb-2.5 sm:mb-3">FREE TOOLS</h2>
      
      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {freeTools.map((tool) => (
          <div 
            key={tool.id} 
            className="flex flex-col items-center cursor-pointer group transition-transform active:scale-95"
            onClick={tool.onClick}
          >
            <div className="bg-white p-1.5 sm:p-2 rounded-lg shadow-sm mb-1.5 sm:mb-2 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              {tool.icon}
            </div>
            <span className="text-[10px] sm:text-xs text-center leading-tight line-clamp-2">
              {tool.title.replace(/ /g, '\n')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
