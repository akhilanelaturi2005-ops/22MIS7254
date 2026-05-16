import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Chip
} from '@mui/material';
import {
  Work as PlacementIcon,
  Event as EventIcon,
  AssignmentTurnedIn as ResultIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://4.224.186.213/evaluation-service/notifications';

const TYPE_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

export default function NotificationApp() {
  const [currentTab, setCurrentTab] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewedIds, setViewedIds] = useState(new Set());

  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [priorityCount, setPriorityCount] = useState(10);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_BASE_URL}?page=${page}&limit=${limit}`;
        if (typeFilter !== 'all') {
          url += `&notification_type=${typeFilter}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to pull system notifications.');
        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [page, limit, typeFilter]);

  const prioritizedNotifications = useMemo(() => {
    if (!notifications.length) return [];

    return [...notifications]
      .map(notification => {
        const weight = TYPE_WEIGHTS[notification.Type] || 0;
        const recencyScore = new Date(notification.Timestamp).getTime();
        return { ...notification, weight, recencyScore };
      })
      .sort((a, b) => {
        if (b.weight !== a.weight) {
          return b.weight - a.weight;
        }
        return b.recencyScore - a.recencyScore;
      })
      .slice(0, priorityCount);
  }, [notifications, priorityCount]);

  const markAsRead = (id) => {
    setViewedIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Placement': return <PlacementIcon color="primary" />;
      case 'Result': return <ResultIcon color="success" />;
      case 'Event': return <EventIcon color="warning" />;
      default: return <PriorityIcon />;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
        Campus Notifications Microservice
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} centered>
          <Tab label="All Notifications Feed" />
          <Tab label="⚡ Priority Inbox" />
        </Tabs>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {currentTab === 0 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Notification Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Notification Type"
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="Placement">Placements</MenuItem>
                  <MenuItem value="Result">Results</MenuItem>
                  <MenuItem value="Event">Events</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Items Per Page</InputLabel>
                <Select
                  value={limit}
                  label="Items Per Page"
                  onChange={(e) => { setLimit(e.target.value); setPage(1); }}
                >
                  <MenuItem value={5}>5 Items</MenuItem>
                  <MenuItem value={10}>10 Items</MenuItem>
                  <MenuItem value={20}>20 Items</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>
          ) : (
            <Box>
              {notifications.map((item) => {
                const isUnread = !viewedIds.has(item.ID);
                return (
                  <Card key={item.ID} sx={{ mb: 2, borderLeft: isUnread ? '5px solid #1976d2' : '5px solid #b0bec5', bgcolor: isUnread ? '#fcfdfe' : '#ffffff' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        {getIcon(item.Type)}
                        <Box>
                          <Typography variant="subtitle1" fontWeight={isUnread ? 'bold' : 'normal'}>
                            {item.Message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Category: {item.Type} • {item.Timestamp}
                          </Typography>
                        </Box>
                      </Box>
                      {isUnread && (
                        <Button size="small" variant="outlined" onClick={() => markAsRead(item.ID)}>
                          Mark Read
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination count={5} page={page} onChange={(e, val) => setPage(val)} color="primary" />
              </Box>
            </Box>
          )}
        </Box>
      )}

      {currentTab === 1 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Displaying localized top sorted entries based on <strong>Weight (Placement &gt; Result &gt; Event)</strong> and <strong>Recency</strong>.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Show Top (n)</InputLabel>
                <Select
                  value={priorityCount}
                  label="Show Top (n)"
                  onChange={(e) => setPriorityCount(e.target.value)}
                >
                  <MenuItem value={5}>Top 5</MenuItem>
                  <MenuItem value={10}>Top 10</MenuItem>
                  <MenuItem value={15}>Top 15</MenuItem>
                  <MenuItem value={20}>Top 20</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>
          ) : prioritizedNotifications.length === 0 ? (
            <Typography align="center" color="text.secondary">No items found to prioritize.</Typography>
          ) : (
            prioritizedNotifications.map((item, index) => {
              const isUnread = !viewedIds.has(item.ID);
              return (
                <Card key={`priority-${item.ID}`} sx={{ mb: 2, borderLeft: '5px solid #d32f2f', bgcolor: '#fff8f8' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box display="flex" alignItems="center" justifyContent="center" sx={{ width: 28, height: 28, bgcolor: 'error.main', color: 'white', borderRadius: '50%', mr: 1, fontSize: '0.8rem', fontWeight: 'bold' }}>
                        #{index + 1}
                      </Box>
                      {getIcon(item.Type)}
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.Message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Type: <strong>{item.Type}</strong> • Posted: {item.Timestamp}
                        </Typography>
                      </Box>
                    </Box>
                    {isUnread ? (
                      <Chip label="Unread" color="error" size="small" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">Viewed</Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      )}
    </Container>
  );
}
