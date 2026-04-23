// ═══════════════════════════════════════════
// SHIELD — Analytics Service
// ═══════════════════════════════════════════
// Track usage, incidents, and generate insights

const { findMany, insertOne } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Track user event
 */
function trackEvent(userId, eventType, eventData = {}) {
  try {
    const event = {
      id: uuidv4(),
      userId,
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    insertOne('analytics_events', event);

    return { success: true, eventId: event.id };
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user statistics
 */
function getUserStats(userId) {
  try {
    const events = findMany('analytics_events', e => e.userId === userId);
    const sosAlerts = findMany('sos_alerts', a => a.userId === userId);
    const locations = findMany('locations', l => l.userId === userId);
    const contacts = findMany('contacts', c => c.userId === userId);

    // Calculate stats
    const totalSOSAlerts = sosAlerts.length;
    const activeAlerts = sosAlerts.filter(a => a.status === 'active').length;
    const resolvedAlerts = sosAlerts.filter(a => a.status === 'resolved').length;

    // Average response time (time to mark safe)
    const resolvedWithTime = sosAlerts.filter(a => a.resolvedAt);
    const avgResponseTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, alert) => {
          const duration = new Date(alert.resolvedAt) - new Date(alert.triggeredAt);
          return sum + duration;
        }, 0) / resolvedWithTime.length / 1000 // Convert to seconds
      : 0;

    // Location updates
    const totalLocationUpdates = locations.length;

    // Last 30 days activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAlerts = sosAlerts.filter(a => new Date(a.triggeredAt) > thirtyDaysAgo);

    return {
      success: true,
      stats: {
        totalSOSAlerts,
        activeAlerts,
        resolvedAlerts,
        totalLocationUpdates,
        totalContacts: contacts.length,
        avgResponseTimeSeconds: Math.round(avgResponseTime),
        alertsLast30Days: recentAlerts.length,
        lastAlertDate: sosAlerts.length > 0 
          ? sosAlerts.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt))[0].triggeredAt
          : null
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get system-wide analytics (admin)
 */
function getSystemAnalytics() {
  try {
    const users = findMany('users', () => true);
    const sosAlerts = findMany('sos_alerts', () => true);
    const locations = findMany('locations', () => true);
    const families = findMany('families', () => true);

    // User distribution by plan
    const planDistribution = {
      free: users.filter(u => u.plan === 'free').length,
      premium: users.filter(u => u.plan === 'premium').length,
      family: users.filter(u => u.plan === 'family').length
    };

    // SOS statistics
    const totalAlerts = sosAlerts.length;
    const activeAlerts = sosAlerts.filter(a => a.status === 'active').length;
    const resolvedAlerts = sosAlerts.filter(a => a.status === 'resolved').length;

    // Trigger method distribution
    const triggerMethods = {
      shake: sosAlerts.filter(a => a.triggerMethod === 'shake').length,
      voice: sosAlerts.filter(a => a.triggerMethod === 'voice').length,
      manual: sosAlerts.filter(a => a.triggerMethod === 'manual').length
    };

    // Time-based analysis
    const today = new Date().toISOString().split('T')[0];
    const alertsToday = sosAlerts.filter(a => a.triggeredAt.startsWith(today)).length;

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const alertsLast7Days = sosAlerts.filter(a => new Date(a.triggeredAt) > last7Days).length;

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const alertsLast30Days = sosAlerts.filter(a => new Date(a.triggeredAt) > last30Days).length;

    // Average response time
    const resolvedWithTime = sosAlerts.filter(a => a.resolvedAt);
    const avgResponseTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, alert) => {
          const duration = new Date(alert.resolvedAt) - new Date(alert.triggeredAt);
          return sum + duration;
        }, 0) / resolvedWithTime.length / 1000
      : 0;

    return {
      success: true,
      analytics: {
        users: {
          total: users.length,
          planDistribution,
          newUsersLast7Days: users.filter(u => new Date(u.createdAt) > last7Days).length
        },
        sosAlerts: {
          total: totalAlerts,
          active: activeAlerts,
          resolved: resolvedAlerts,
          today: alertsToday,
          last7Days: alertsLast7Days,
          last30Days: alertsLast30Days,
          triggerMethods,
          avgResponseTimeSeconds: Math.round(avgResponseTime)
        },
        locations: {
          totalUpdates: locations.length,
          updatesLast24Hours: locations.filter(l => 
            new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length
        },
        families: {
          total: families.length,
          totalMembers: families.reduce((sum, f) => sum + f.members.length, 0)
        }
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get alert heatmap data (by hour of day)
 */
function getAlertHeatmap() {
  try {
    const sosAlerts = findMany('sos_alerts', () => true);

    const hourlyDistribution = Array(24).fill(0);

    sosAlerts.forEach(alert => {
      const hour = new Date(alert.triggeredAt).getHours();
      hourlyDistribution[hour]++;
    });

    return {
      success: true,
      heatmap: hourlyDistribution.map((count, hour) => ({
        hour,
        count,
        label: `${hour}:00 - ${hour}:59`
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get geographic distribution of alerts
 */
function getGeographicDistribution() {
  try {
    const sosAlerts = findMany('sos_alerts', a => a.latitude && a.longitude);

    const locations = sosAlerts.map(alert => ({
      latitude: alert.latitude,
      longitude: alert.longitude,
      triggeredAt: alert.triggeredAt,
      status: alert.status
    }));

    return {
      success: true,
      totalAlerts: locations.length,
      locations
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user engagement metrics
 */
function getEngagementMetrics(userId) {
  try {
    const events = findMany('analytics_events', e => e.userId === userId);
    const aiConversations = findMany('ai_conversations', c => c.userId === userId);

    // Group events by type
    const eventsByType = {};
    events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    });

    // Last activity
    const allEvents = [...events, ...aiConversations].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const lastActivity = allEvents[0]?.timestamp || null;

    // Active days (days with at least one event)
    const activeDays = new Set(events.map(e => e.date)).size;

    return {
      success: true,
      engagement: {
        totalEvents: events.length,
        eventsByType,
        aiConversations: aiConversations.length,
        lastActivity,
        activeDays
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate safety score for user
 */
function calculateSafetyScore(userId) {
  try {
    const user = findMany('users', u => u.id === userId)[0];
    const contacts = findMany('contacts', c => c.userId === userId);
    const sosAlerts = findMany('sos_alerts', a => a.userId === userId);
    const locations = findMany('locations', l => l.userId === userId);

    let score = 0;
    const factors = [];

    // Has contacts (max 30 points)
    if (contacts.length >= 2) {
      score += 30;
      factors.push({ factor: 'Has trusted contacts', points: 30 });
    } else if (contacts.length === 1) {
      score += 15;
      factors.push({ factor: 'Has 1 trusted contact', points: 15 });
    }

    // Premium/Family plan (20 points)
    if (user.plan === 'premium' || user.plan === 'family') {
      score += 20;
      factors.push({ factor: 'Premium features enabled', points: 20 });
    }

    // Location sharing enabled (15 points)
    if (locations.length > 0) {
      score += 15;
      factors.push({ factor: 'Location sharing active', points: 15 });
    }

    // SOS tested (10 points)
    if (sosAlerts.length > 0) {
      score += 10;
      factors.push({ factor: 'SOS system tested', points: 10 });
    }

    // Quick response time (15 points)
    const resolvedAlerts = sosAlerts.filter(a => a.resolvedAt);
    if (resolvedAlerts.length > 0) {
      const avgResponseTime = resolvedAlerts.reduce((sum, alert) => {
          const duration = new Date(alert.resolvedAt) - new Date(alert.triggeredAt);
          return sum + duration;
        }, 0) / resolvedAlerts.length / 1000;

      if (avgResponseTime < 300) { // Less than 5 minutes
        score += 15;
        factors.push({ factor: 'Fast emergency response', points: 15 });
      } else if (avgResponseTime < 600) { // Less than 10 minutes
        score += 10;
        factors.push({ factor: 'Good emergency response', points: 10 });
      }
    }

    // Active user (10 points)
    const recentActivity = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLocations = locations.filter(l => new Date(l.timestamp) > recentActivity);
    if (recentLocations.length > 0) {
      score += 10;
      factors.push({ factor: 'Active user', points: 10 });
    }

    // Determine rating
    let rating = 'Poor';
    if (score >= 80) rating = 'Excellent';
    else if (score >= 60) rating = 'Good';
    else if (score >= 40) rating = 'Fair';

    return {
      success: true,
      safetyScore: {
        score,
        maxScore: 100,
        rating,
        factors,
        recommendations: generateRecommendations(score, user, contacts)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate safety recommendations
 */
function generateRecommendations(score, user, contacts) {
  const recommendations = [];

  if (contacts.length < 2) {
    recommendations.push({
      priority: 'high',
      message: 'Add more trusted contacts for better protection',
      action: 'add_contacts'
    });
  }

  if (user.plan === 'free') {
    recommendations.push({
      priority: 'medium',
      message: 'Upgrade to Premium for evidence recording and faster GPS updates',
      action: 'upgrade_plan'
    });
  }

  if (score < 50) {
    recommendations.push({
      priority: 'high',
      message: 'Test your SOS trigger to ensure it works when needed',
      action: 'test_sos'
    });
  }

  if (contacts.length > 0 && !contacts.some(c => c.verified)) {
    recommendations.push({
      priority: 'medium',
      message: 'Verify your trusted contacts to ensure they receive alerts',
      action: 'verify_contacts'
    });
  }

  return recommendations;
}

module.exports = {
  trackEvent,
  getUserStats,
  getSystemAnalytics,
  getAlertHeatmap,
  getGeographicDistribution,
  getEngagementMetrics,
  calculateSafetyScore
};
