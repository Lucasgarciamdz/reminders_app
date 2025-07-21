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
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { CreateReminderRequest, Priority, AddReminderFormProps } from '../types';
import { createReminder } from '../store/slices/remindersSlice';
import { hideAddReminderForm, selectShowAddForm, addNotification } from '../store/slices/uiSlice';
import { AppDispatch } from '../store';

interface FormData {
  text: string;
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
      text: '',
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
      // Format the date and time for the API
      const reminderDate = data.reminderDate.format('YYYY-MM-DD');
      let reminderTime: string | undefined;
      
      if (!data.isAllDay && data.reminderTime) {
        reminderTime = data.reminderTime.format('HH:mm:ss');
      }

      const reminderData: CreateReminderRequest = {
        text: data.text.trim(),
        reminderDate,
        reminderTime,
        isAllDay: data.isAllDay,
        priority: data.priority,
        completed: false,
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
        open={showForm}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="h2">
            Add New Reminder
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Reminder Text */}
            <Controller
              name="text"
              control={control}
              rules={{
                required: 'Reminder text is required',
                maxLength: {
                  value: 500,
                  message: 'Reminder text must be less than 500 characters'
                },
                minLength: {
                  value: 1,
                  message: 'Reminder text cannot be empty'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reminder Text"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.text}
                  helperText={errors.text?.message}
                  placeholder="Enter your reminder..."
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
            onClick={handleCancel}
            variant="outlined"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
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