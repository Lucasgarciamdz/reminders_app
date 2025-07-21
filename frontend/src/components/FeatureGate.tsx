import React from 'react';
import {
  Box,
  Tooltip,
  Alert,
  Typography,
  Button,
} from '@mui/material';
import {
  WifiOff,
  Info,
} from '@mui/icons-material';
import { useFeatureCheck } from '../hooks/useFeatureAvailability';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMessage?: boolean;
  disabled?: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showMessage = true,
  disabled = false,
}) => {
  const { isAvailable, message, requiresOnline } = useFeatureCheck(feature);

  // If feature is available, render children normally
  if (isAvailable && !disabled) {
    return <>{children}</>;
  }

  // If we have a custom fallback, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback behavior
  const renderDisabledFeature = () => {
    // Clone children and disable them if they're interactive elements
    const disabledChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        // Handle common interactive components
        if (child.type === Button || (child.props && 'onClick' in child.props)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            disabled: true,
            onClick: undefined,
          });
        }
        
        // Handle form inputs
        if (child.props && ('value' in child.props || 'checked' in child.props)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            disabled: true,
            readOnly: true,
          });
        }
      }
      return child;
    });

    const content = (
      <Box
        sx={{
          position: 'relative',
          opacity: 0.6,
          pointerEvents: 'none',
          filter: 'grayscale(50%)',
        }}
      >
        {disabledChildren}
      </Box>
    );

    // Wrap with tooltip if we have a message
    if (message && showMessage) {
      return (
        <Tooltip
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {requiresOnline && <WifiOff fontSize="small" />}
              <Typography variant="body2">{message}</Typography>
            </Box>
          }
          arrow
        >
          <Box>{content}</Box>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <Box>
      {renderDisabledFeature()}
      
      {/* Show inline message for important features */}
      {showMessage && message && requiresOnline && (
        <Alert
          severity="info"
          icon={<WifiOff />}
          sx={{ mt: 1 }}
        >
          <Typography variant="body2">{message}</Typography>
        </Alert>
      )}
    </Box>
  );
};

// Higher-order component for feature gating
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  options?: {
    fallback?: React.ReactNode;
    showMessage?: boolean;
  }
) {
  const FeatureGatedComponent: React.FC<P> = (props) => {
    return (
      <FeatureGate
        feature={feature}
        fallback={options?.fallback}
        showMessage={options?.showMessage}
      >
        <WrappedComponent {...props} />
      </FeatureGate>
    );
  };

  FeatureGatedComponent.displayName = `withFeatureGate(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return FeatureGatedComponent;
}

export default FeatureGate;