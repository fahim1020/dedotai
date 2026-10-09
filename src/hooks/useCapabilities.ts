import { useState, useEffect } from 'react';
import { DeviceCapabilities } from '@/types';
import { detectCapabilities } from '@/lib/inference/capability-detect';

export function useCapabilities() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        const caps = await detectCapabilities();
        if (mounted) {
          setCapabilities(caps);
          setIsDetecting(false);
        }
      } catch (error) {
        console.error('Failed to detect capabilities:', error);
        if (mounted) {
          setIsDetecting(false);
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  return { capabilities, isDetecting };
}
