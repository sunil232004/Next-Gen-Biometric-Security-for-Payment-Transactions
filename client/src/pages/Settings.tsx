import { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  Camera, 
  Mic, 
  Plus, 
  Settings as SettingsIcon,
  ChevronLeft,
  Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import BiometricAuthModal from '@/components/BiometricAuthModal';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useLocation } from 'wouter';

interface BiometricMethod {
  id: number;
  type: 'fingerprint' | 'face' | 'voice';
  label: string;
  createdAt: string;
}

export default function Settings() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [biometricMethods, setBiometricMethods] = useState<BiometricMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // For demo purposes, using user ID 1
  const userId = 1;
  
  const fetchBiometricMethods = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/biometric/${userId}`);
      setBiometricMethods(response);
    } catch (error) {
      console.error('Error fetching biometric methods:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your authentication methods.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBiometricMethods();
  }, []);
  
  const handleSuccessfulRegistration = async (type: string, data: string) => {
    setTimeout(() => {
      setIsModalOpen(false);
      fetchBiometricMethods();
      toast({
        title: 'Success',
        description: `New ${type} authentication added successfully!`,
      });
    }, 1000);
  };
  
  const handleDeleteMethod = async (id: number, label: string) => {
    try {
      await apiRequest(`/api/biometric/${id}`, {
        method: 'DELETE'
      });
      
      toast({
        title: 'Success',
        description: `${label} has been removed.`,
      });
      
      fetchBiometricMethods();
    } catch (error) {
      console.error('Error deleting biometric method:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete authentication method.',
      });
    }
  };
  
  const getIconForType = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return <Fingerprint className="h-6 w-6 text-[#0d4bb5]" />;
      case 'face':
        return <Camera className="h-6 w-6 text-[#0d4bb5]" />;
      case 'voice':
        return <Mic className="h-6 w-6 text-[#0d4bb5]" />;
      default:
        return <Fingerprint className="h-6 w-6 text-[#0d4bb5]" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="max-w-md mx-auto h-screen overflow-y-auto bg-white shadow-lg flex flex-col">
      <header className="bg-[#001e84] text-white px-4 py-3 flex items-center sticky top-0 z-10">
        <button 
          className="mr-3 focus:outline-none" 
          onClick={() => setLocation('/')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <SettingsIcon className="h-5 w-5 mr-2" />
        <h1 className="text-lg font-semibold">Security Settings</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Biometric Authentication</CardTitle>
            <CardDescription>
              Manage your biometric payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Method
              </Button>
            </div>
            
            {isLoading ? (
              <div className="py-8 text-center">Loading authentication methods...</div>
            ) : biometricMethods.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>You haven't set up any biometric authentication methods yet.</p>
                <p className="mt-2">Add one to enable secure payments.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {biometricMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded-full">
                        {getIconForType(method.type)}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium">{method.label}</h3>
                        <p className="text-xs text-gray-500">
                          Added on {formatDate(method.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMethod(method.id, method.label)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About Biometric Authentication</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p>
              Biometric authentication provides a secure way to verify your identity
              when making payments. You can use fingerprints, face recognition, or
              voice verification.
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Fingerprint className="h-5 w-5 mr-2 text-[#0d4bb5]" />
                <p><strong>Fingerprint:</strong> Securely scans your fingerprint pattern.</p>
              </div>
              <div className="flex items-center">
                <Camera className="h-5 w-5 mr-2 text-[#0d4bb5]" />
                <p><strong>Face Recognition:</strong> Uses unique facial features to identify you.</p>
              </div>
              <div className="flex items-center">
                <Mic className="h-5 w-5 mr-2 text-[#0d4bb5]" />
                <p><strong>Voice Recognition:</strong> Validates your unique voice pattern.</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Your biometric data is stored securely and never leaves your device.
              It's used only to verify your identity for payments.
            </p>
          </CardContent>
        </Card>
      </main>
      
      <BiometricAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccessfulRegistration}
        mode="register"
        userId={userId}
      />
    </div>
  );
}