import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { CreateReminderRequest, Priority } from '../types';
import { createReminder } from '../store/slices/remindersSlice';
import { hideAddReminderForm, selectShowAddForm, addNotification } from '../store/slices/uiSlice';
import { AppDispatch } from '../store';

interface FormData {
  title: string;
  description?: string;
  reminderDate: dayjs.Dayjs;
  reminderTime: dayjs.Dayjs | null;
  isAllDay: boolean;
  priority: Priority;
}

const AddReminderForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const showForm = useSelector(selectShowAddForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      reminderDate: dayjs(),
      reminderTime: dayjs(),
      isAllDay: false,
      priority: Priority.MEDIUM,
    },
    mode: 'onBlur',
  });

  const isAllDay = watch('isAllDay');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Format the date and time for the API - combine date and time into ISO datetime
      let dueDate: string;
      
      if (data.isAllDay) {
        // For all-day reminders, set time to start of day
        dueDate = data.reminderDate.startOf('day').toISOString();
      } else if (data.reminderTime) {
        // Combine date and time
        const combinedDateTime = data.reminderDate
          .hour(data.reminderTime.hour())
          .minute(data.reminderTime.minute())
          .second(0);
        dueDate = combinedDateTime.toISOString();
      } else {
        // Default to start of day if no time specified
        dueDate = data.reminderDate.startOf('day').toISOString();
      }

      const reminderData: CreateReminderRequest = {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        dueDate,
        isCompleted: false,
        priority: data.priority,
      };

      await dispatch(createReminder(reminderData)).unwrap();
      
      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'Reminder created successfully!',
        duration: 3000,
      }));

      // Reset form and close dialog
      reset();
      dispatch(hideAddReminderForm());
    } catch (error: any) {
      console.error('Failed to create reminder:', error);
      
      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create reminder. Please try again.',
        duration: 5000,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    dispatch(hideAddReminderForm());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        data-testid="add-reminder-form"
        open={showForm}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 2 }
          }
        }}
      >
        <DialogTitle>
          Add New Reminder
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Reminder Title */}
            <Controller
              name="title"
              control={control}
              rules={{
                required: 'Reminder title is required',
                maxLength: {
                  value: 255,
                  message: 'Reminder title must be less than 255 characters'
                },
                minLength: {
                  value: 1,
                  message: 'Reminder title cannot be empty'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  data-testid="reminder-title"
                  label="Reminder Title"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  placeholder="Enter your reminder title..."
                  variant="outlined"
                />
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              rules={{
                maxLength: {
                  value: 1000,
                  message: 'Description must be less than 1000 characters'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  data-testid="reminder-description"
                  label="Description (Optional)"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  placeholder="Enter additional details..."
                  variant="outlined"
                />
              )}
            />

            {/* Date Picker */}
            <Controller
              name="reminderDate"
              control={control}
              rules={{
                required: 'Date is required'
              }}
              render={({ field }) => (
                <DatePicker
                  label="Date *"
                  value={field.value}
                  onChange={(newValue) => field.onChange(newValue)}
                  minDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.reminderDate,
                      helperText: errors.reminderDate?.message,
                      variant: 'outlined',
                      inputProps: {
                        'data-testid': 'reminder-due-date',
                      },
                    },
                  }}
                />
              )}
            />

            {/* All Day Toggle */}
            <Controller
              name="isAllDay"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="All Day"
                />
              )}
            />

            {/* Time Picker - Only show if not all day */}
            {!isAllDay && (
              <Controller
                name="reminderTime"
                control={control}
                rules={{
                  required: !isAllDay ? 'Time is required when not all day' : false
                }}
                render={({ field }) => (
                  <TimePicker
                    label="Time *"
                    value={field.value}
                    onChange={(newValue) => field.onChange(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.reminderTime,
                        helperText: errors.reminderTime?.message,
                        variant: 'outlined',
                      },
                    }}
                  />
                )}
              />
            )}

            {/* Priority Selector */}
            <Controller
              name="priority"
              control={control}
              rules={{
                required: 'Priority is required'
              }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    {...field}
                    data-testid="reminder-priority"
                    label="Priority"
                    variant="outlined"
                  >
                    <MenuItem value={Priority.LOW}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#4caf50'
                          }}
                        />
                        Low
                      </Box>
                    </MenuItem>
                    <MenuItem value={Priority.MEDIUM}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#ff9800'
                          }}
                        />
                        Medium
                      </Box>
                    </MenuItem>
                    <MenuItem value={Priority.HIGH}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#f44336'
                          }}
                        />
                        High
                      </Box>
                    </MenuItem>
                  </Select>
                  {errors.priority && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.priority.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            data-testid="cancel-reminder"
            onClick={handleCancel}
            variant="outlined"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            data-testid="save-reminder"
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ minWidth: 100 }}
          >
            {isSubmitting ? 'Creating...' : 'Create Reminder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
    </LocalizationProvider>
  );
};

export default AddReminderForm;