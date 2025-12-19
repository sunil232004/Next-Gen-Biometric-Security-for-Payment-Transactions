import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface WebSocketMessage {
  type: 'payment_update' | 'balance_update' | 'transaction_update' | 'biometric_update' | 'user_update';
  payload: any;
  userId?: string;
  timestamp: string;
}

interface UseRealtimeSyncOptions {
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const { 
    enabled = true, 
    onMessage,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;
  
  const { user, token, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  // Get WebSocket URL based on environment
  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || window.location.host;
    return `${protocol}//${host}/ws`;
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Only process messages for this user
      if (message.userId && message.userId !== user?._id) {
        return;
      }

      setLastMessage(message);

      // Handle different message types
      switch (message.type) {
        case 'payment_update':
        case 'transaction_update':
          // Invalidate payment history and transaction queries
          queryClient.invalidateQueries({ queryKey: ['payment-history'] });
          queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
          break;
          
        case 'balance_update':
          // Refresh user data to get updated balance
          refreshUser();
          break;
          
        case 'biometric_update':
          // Refresh user to get updated biometrics
          refreshUser();
          break;
          
        case 'user_update':
          // Refresh user data
          refreshUser();
          break;
      }

      // Call custom handler if provided
      onMessage?.(message);
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }, [user?._id, queryClient, refreshUser, onMessage]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || !user || !token) {
      return;
    }

    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${getWsUrl()}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Send authentication message
        ws.send(JSON.stringify({
          type: 'auth',
          token,
          userId: user._id
        }));
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[WebSocket] Reconnecting... Attempt ${reconnectAttemptsRef.current}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
    }
  }, [enabled, user, token, getWsUrl, handleMessage, reconnectInterval, maxReconnectAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: Partial<WebSocketMessage>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
      return true;
    }
    return false;
  }, []);

  // Connect on mount and when user/token changes
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when visibility changes (tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && enabled && user) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, isConnected, enabled, user]);

  // Reconnect on online event
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && enabled && user) {
        reconnectAttemptsRef.current = 0;
        connect();
      }
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [connect, isConnected, enabled, user]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
}

// Hook for polling fallback when WebSocket is not available
export function usePollingSync(options: { interval?: number; enabled?: boolean } = {}) {
  const { interval = 30000, enabled = true } = options;
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!enabled || !user) return;

    const poll = async () => {
      try {
        // Refresh user data
        await refreshUser();
        // Invalidate cached queries to refetch
        queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      } catch (error) {
        console.error('[Polling] Sync error:', error);
      }
    };

    const intervalId = setInterval(poll, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, user, interval, refreshUser, queryClient]);
}

// Combined hook that uses WebSocket when available, falls back to polling
export function useDataSync(options: UseRealtimeSyncOptions & { pollingInterval?: number } = {}) {
  const { pollingInterval = 30000, ...wsOptions } = options;
  
  const ws = useRealtimeSync(wsOptions);
  
  // Use polling as fallback when WebSocket is not connected
  usePollingSync({
    interval: pollingInterval,
    enabled: !ws.isConnected && (options.enabled ?? true)
  });

  return ws;
}
