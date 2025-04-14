import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Toaster as OldToaster } from '@/components/ui/toaster';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

function App() {
  return (
    <div>
      <Toaster position="top-center" />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MainLayout />
          <OldToaster />
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  );
}

export default App;