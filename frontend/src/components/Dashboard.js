import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Fab,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Add as AddIcon,
  Refresh as RefreshIcon,
  WifiOff as OfflineIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import ReminderList from './ReminderList';
import AddReminderForm from './AddReminderForm';
import ReminderFilters from './ReminderFilters';
import {
  fetchReminders,
  toggleReminderCompletion,
  deleteReminder,
  selectFilteredReminders,
  selectRemindersLoading,
  selectRemindersError,
  selectRemindersFilters,
  setFilters,
  clearError,
} from '../store/slices/remindersSlice';
import { showAddReminderForm } from '../store/slices/uiSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const isOnline = useOnlineStatus();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Redux state
  const reminders = useSelector(selectFilteredReminders);
  const loading = useSelector(selectRemindersLoading);
  const error = useSelector(selectRemindersError);
  const filters = useSelector(selectRemindersFilters);

  // Local state
  const [anchorEl, setAnchorEl] = useState(null);
  const [showError, setShowError] = useState(false);

  // Fetch reminders on component mount
  useEffect(() => {
    dispatch(fetchReminders());
  }, [dispatch]);

  // Handle error display
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleRefresh = () => {
    dispatch(fetchReminders());
  };

  const handleToggleComplete = async (id) => {
    try {
      await dispatch(toggleReminderCompletion(id)).unwrap();
    } catch (error) {
      console.error('Failed to toggle reminder completion:', error);
      throw error; // Re-throw to let ReminderItem handle the error
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await dispatch(deleteReminder(id)).unwrap();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error; // Re-throw to let ReminderItem handle the error
    }
  };

  const handleAddReminder = () => {
    dispatch(showAddReminderForm());
  };

  const handleCloseError = () => {
    setShowError(false);
    dispatch(clearError());
  };

  const handleFiltersChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          {/* Menu Icon (Mobile) */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* App Title */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Reminders
          </Typography>

          {/* Offline Indicator */}
          {!isOnline && (
            <Box display="flex" alignItems="center" mr={2}>
              <OfflineIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">Offline</Typography>
            </Box>
          )}

          {/* Refresh Button */}
          <IconButton
            color="inherit"
            onClick={handleRefresh}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            <RefreshIcon />
          </IconButton>

          {/* User Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            {user?.firstName ? (
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                {user.firstName.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <AccountCircle />
            )}
          </IconButton>

          {/* User Menu Dropdown */}
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.firstName || user?.login || 'User'}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Typography color="error">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ pb: 10 }}>
        {/* Filters */}
        <ReminderFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        
        {/* Reminders List */}
        <ReminderList
          reminders={reminders}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteReminder}
          loading={loading}
          filters={filters}
        />
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add reminder"
        onClick={handleAddReminder}
        sx={{
          position: 'fixed',
          bottom: theme.spacing(2),
          right: theme.spacing(2),
          zIndex: theme.zIndex.speedDial,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Add Reminder Form */}
      <AddReminderForm />

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;