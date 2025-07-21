import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Typography,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Stack,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
  Flag as PriorityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { ReminderFiltersProps, Priority } from '../types';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const priorityOptions = [
  { value: Priority.LOW, label: 'Low', color: '#4caf50' },
  { value: Priority.MEDIUM, label: 'Medium', color: '#ff9800' },
  { value: Priority.HIGH, label: 'High', color: '#f44336' },
];

const completionOptions = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'incomplete', label: 'Incomplete' },
];

const ReminderFilters: React.FC<ReminderFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState(false);

  // Local state for date range picker
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    filters.dateRange?.start ? dayjs(filters.dateRange.start) : null,
    filters.dateRange?.end ? dayjs(filters.dateRange.end) : null,
  ]);

  // Handle search text change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchText: event.target.value,
    });
  };

  // Handle completion status change
  const handleCompletionChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: string | null
  ) => {
    if (newValue !== null) {
      let completed: boolean | undefined;
      if (newValue === 'completed') completed = true;
      else if (newValue === 'incomplete') completed = false;
      else completed = undefined;

      onFiltersChange({
        ...filters,
        completed,
      });
    }
  };

  // Handle priority change
  const handlePriorityChange = (event: any) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      priority: typeof value === 'string' ? value.split(',') : value,
    });
  };

  // Handle date range change
  const handleDateRangeChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    setDateRange(newValue);
    
    if (newValue[0] && newValue[1]) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: newValue[0].toDate(),
          end: newValue[1].toDate(),
        },
      });
    } else {
      onFiltersChange({
        ...filters,
        dateRange: undefined,
      });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setDateRange([null, null]);
    onFiltersChange({
      completed: undefined,
      priority: undefined,
      dateRange: undefined,
      searchText: '',
    });
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.completed !== undefined ||
    (filters.priority && filters.priority.length > 0) ||
    filters.dateRange ||
    (filters.searchText && filters.searchText.trim());

  // Get current completion status for toggle
  const getCurrentCompletionValue = () => {
    if (filters.completed === true) return 'completed';
    if (filters.completed === false) return 'incomplete';
    return 'all';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card 
        elevation={2}
        sx={{ 
          mb: 3,
          borderRadius: 2,
          border: hasActiveFilters ? `2px solid ${theme.palette.primary.main}` : 'none',
        }}
      >
        <CardContent sx={{ pb: expanded ? 2 : '16px !important' }}>
          {/* Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={expanded ? 2 : 0}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <FilterListIcon color="primary" />
              <Typography variant="h6" fontWeight="medium">
                Filters
              </Typography>
              {hasActiveFilters && (
                <Chip
                  size="small"
                  label="Active"
                  color="primary"
                  variant="filled"
                />
              )}
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              {hasActiveFilters && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  color="secondary"
                >
                  Clear
                </Button>
              )}
              <IconButton
                onClick={() => setExpanded(!expanded)}
                size="small"
                color="primary"
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Search Bar - Always visible */}
          <TextField
            fullWidth
            placeholder="Search reminders..."
            value={filters.searchText || ''}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
            sx={{ mb: expanded ? 2 : 0 }}
          />

          {/* Expandable Filters */}
          <Collapse in={expanded}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Divider />
              
              {/* Date Range Filter */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <DateRangeIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight="medium">
                    Date Range
                  </Typography>
                </Box>
                <Box display="flex" gap={2} flexDirection={isMobile ? 'column' : 'row'}>
                  <DatePicker
                    label="From"
                    value={dateRange[0]}
                    onChange={(newValue) => handleDateRangeChange([newValue, dateRange[1]])}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                  <DatePicker
                    label="To"
                    value={dateRange[1]}
                    onChange={(newValue) => handleDateRangeChange([dateRange[0], newValue])}
                    minDate={dateRange[0] || undefined}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Completion Status Filter */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CheckCircleIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight="medium">
                    Status
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  value={getCurrentCompletionValue()}
                  exclusive
                  onChange={handleCompletionChange}
                  size="small"
                  fullWidth={isMobile}
                >
                  {completionOptions.map((option) => (
                    <ToggleButton
                      key={option.value}
                      value={option.value}
                      sx={{ 
                        flex: isMobile ? 1 : 'none',
                        minWidth: isMobile ? 'auto' : 100,
                      }}
                    >
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Priority Filter */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PriorityIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight="medium">
                    Priority
                  </Typography>
                </Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Select priorities</InputLabel>
                  <Select
                    multiple
                    value={filters.priority || []}
                    onChange={handlePriorityChange}
                    input={<OutlinedInput label="Select priorities" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as Priority[]).map((value) => {
                          const option = priorityOptions.find(opt => opt.value === value);
                          return (
                            <Chip
                              key={value}
                              label={option?.label}
                              size="small"
                              sx={{
                                backgroundColor: option?.color,
                                color: 'white',
                                '& .MuiChip-deleteIcon': {
                                  color: 'white',
                                },
                              }}
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {priorityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: option.color,
                            }}
                          />
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Collapse>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default ReminderFilters;