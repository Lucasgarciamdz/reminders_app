import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  useTheme,
  useMediaQuery,
  Fade,
  Skeleton,
} from '@mui/material';
import { ReminderListProps } from '../types';
import ReminderItem from './ReminderItem';
import EmptyState from './EmptyState';

const ReminderList: React.FC<ReminderListProps> = ({
  reminders,
  onToggleComplete,
  onDelete,
  loading,
  filters,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Box>
      {[...Array(3)].map((_, index) => (
        <Box key={index} mb={2}>
          <Skeleton
            variant="rectangular"
            height={120}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      ))}
    </Box>
  );

  // Error state
  if (!loading && reminders.length === 0 && filters) {
    // Check if filters are applied
    const hasActiveFilters = 
      filters.completed !== undefined ||
      (filters.priority && filters.priority.length > 0) ||
      filters.dateRange ||
      (filters.searchText && filters.searchText.trim());

    if (hasActiveFilters) {
      return (
        <Container maxWidth="md" sx={{ py: 2 }}>
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center',
              }
            }}
          >
            <Typography variant="body1" fontWeight="medium">
              No reminders match your current filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Try adjusting your search criteria or clear the filters to see all reminders.
            </Typography>
          </Alert>
        </Container>
      );
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Loading State */}
      {loading && (
        <Fade in={loading}>
          <Box>
            {reminders.length === 0 ? (
              <LoadingSkeleton />
            ) : (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={40} />
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* Empty State */}
      {!loading && reminders.length === 0 && (
        <Fade in={!loading}>
          <Box>
            <EmptyState
              title="No reminders yet"
              subtitle="Create your first reminder to get started organizing your tasks and events."
              showAddButton={true}
              onAddReminder={() => {
                // This will be handled by the parent component
                console.log('Add reminder clicked');
              }}
            />
          </Box>
        </Fade>
      )}

      {/* Reminders List */}
      {!loading && reminders.length > 0 && (
        <Fade in={!loading}>
          <Box>
            {/* List Header */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
              px={isMobile ? 1 : 0}
            >
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                fontWeight="medium"
                color="text.primary"
              >
                Your Reminders
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  backgroundColor: 'grey.100',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'}
              </Typography>
            </Box>

            {/* Reminders */}
            <Box>
              {reminders.map((reminder, index) => (
                <Fade
                  in={true}
                  timeout={300}
                  style={{ transitionDelay: `${index * 50}ms` }}
                  key={reminder.id}
                >
                  <Box>
                    <ReminderItem
                      reminder={reminder}
                      onToggleComplete={onToggleComplete}
                      onDelete={onDelete}
                    />
                  </Box>
                </Fade>
              ))}
            </Box>

            {/* Summary Stats */}
            {reminders.length > 0 && (
              <Box
                mt={4}
                p={2}
                bgcolor="grey.50"
                borderRadius={2}
                display="flex"
                justifyContent="center"
                flexWrap="wrap"
                gap={3}
              >
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {reminders.filter(r => r.completed).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h6" color="warning.main" fontWeight="bold">
                    {reminders.filter(r => !r.completed).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    {reminders.filter(r => r.priority === 'HIGH' && !r.completed).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Priority
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      )}
    </Container>
  );
};

export default ReminderList;