import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';

interface EmptyStateProps {
  onAddReminder?: () => void;
  title?: string;
  subtitle?: string;
  showAddButton?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onAddReminder,
  title = "No reminders yet",
  subtitle = "Create your first reminder to get started organizing your tasks and events.",
  showAddButton = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 3 : 4,
        textAlign: 'center',
        backgroundColor: 'grey.50',
        border: `2px dashed ${theme.palette.grey[300]}`,
        borderRadius: 2,
        my: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Icon */}
        <EventNoteIcon
          sx={{
            fontSize: isMobile ? 64 : 80,
            color: 'grey.400',
            mb: 1,
          }}
        />

        {/* Title */}
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          color="text.secondary"
          fontWeight="medium"
        >
          {title}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 400,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </Typography>

        {/* Add Button */}
        {showAddButton && onAddReminder && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddReminder}
            size={isMobile ? 'medium' : 'large'}
            sx={{
              mt: 2,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: isMobile ? '0.875rem' : '1rem',
            }}
          >
            Create Your First Reminder
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState;