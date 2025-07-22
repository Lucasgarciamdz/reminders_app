import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Checkbox,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ReminderItemProps, Priority } from '../types';

const ReminderItem: React.FC<ReminderItemProps> = ({
  reminder,
  onToggleComplete,
  onDelete,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleToggleComplete = async () => {
    setIsToggling(true);
    try {
      await onToggleComplete(reminder.id);
    } catch (error) {
      console.error('Failed to toggle reminder completion:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(reminder.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      // Keep dialog open on error so user can retry
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return 'error';
      case Priority.MEDIUM:
        return 'warning';
      case Priority.LOW:
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    return <FlagIcon fontSize="small" />;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    try {
      // Handle both full datetime and time-only strings
      const date = timeString.includes('T') 
        ? parseISO(timeString)
        : parseISO(`2000-01-01T${timeString}`);
      return format(date, 'h:mm a');
    } catch {
      return timeString;
    }
  };

  return (
    <>
      <Card
        sx={{
          mb: 2,
          opacity: reminder.isCompleted ? 0.7 : 1,
          backgroundColor: reminder.isCompleted ? 'grey.50' : 'background.paper',
          borderLeft: reminder.isCompleted ? '4px solid' : '4px solid transparent',
          borderLeftColor: reminder.isCompleted ? 'success.main' : 'transparent',
          transition: 'all 0.3s ease-in-out',
          transform: reminder.isCompleted ? 'scale(0.98)' : 'scale(1)',
          '&:hover': {
            boxShadow: reminder.isCompleted ? theme.shadows[2] : theme.shadows[4],
            transform: reminder.isCompleted ? 'scale(0.99)' : 'scale(1.01)',
          },
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="flex-start" gap={2}>
            {/* Completion Checkbox */}
            <Box position="relative" display="inline-flex">
              <Checkbox
                checked={reminder.isCompleted}
                onChange={handleToggleComplete}
                color="primary"
                disabled={isToggling}
                sx={{ mt: -1 }}
              />
              {isToggling && (
                <CircularProgress
                  size={20}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-10px',
                    marginLeft: '-10px',
                  }}
                />
              )}
            </Box>

            {/* Main Content */}
            <Box flex={1} minWidth={0}>
              {/* Reminder Text */}
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                sx={{
                  textDecoration: reminder.isCompleted ? 'line-through' : 'none',
                  color: reminder.isCompleted ? 'text.secondary' : 'text.primary',
                  wordBreak: 'break-word',
                  mb: 1,
                  transition: 'all 0.3s ease-in-out',
                  position: 'relative',
                  '&::after': reminder.isCompleted ? {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: 'success.main',
                    transform: 'scaleX(1)',
                    transformOrigin: 'left',
                    transition: 'transform 0.3s ease-in-out',
                  } : {},
                }}
              >
                {reminder.title}
              </Typography>

              {/* Date and Time Info */}
              <Box
                display="flex"
                flexDirection={isMobile ? 'column' : 'row'}
                alignItems={isMobile ? 'flex-start' : 'center'}
                gap={isMobile ? 1 : 2}
                mb={1}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(reminder.dueDate)}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(reminder.dueDate)}
                  </Typography>
                </Box>
              </Box>

              {/* Priority and Actions */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    icon={getPriorityIcon(reminder.priority)}
                    label={reminder.priority}
                    size="small"
                    color={getPriorityColor(reminder.priority)}
                    variant="outlined"
                    sx={{
                      opacity: reminder.isCompleted ? 0.6 : 1,
                      transition: 'opacity 0.3s ease-in-out',
                    }}
                  />
                  
                  {reminder.isCompleted && (
                    <Chip
                      label="Completed"
                      size="small"
                      color="success"
                      variant="filled"
                      sx={{
                        fontSize: '0.75rem',
                        height: '24px',
                        animation: 'fadeIn 0.3s ease-in-out',
                        '@keyframes fadeIn': {
                          from: { opacity: 0, transform: 'scale(0.8)' },
                          to: { opacity: 1, transform: 'scale(1)' },
                        },
                      }}
                    />
                  )}
                </Box>

                <IconButton
                  onClick={handleDeleteClick}
                  color="error"
                  size="small"
                  sx={{
                    opacity: reminder.isCompleted ? 0.7 : 1,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'error.contrastText',
                      opacity: 1,
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Reminder</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this reminder? This action cannot be undone.
          </Typography>
          <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
            <Typography variant="body2" color="text.secondary">
              "{reminder.title}"
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel} 
            color="primary"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReminderItem;