// ═══════════════════════════════════════════
// SHIELD — Geofence Service
// ═══════════════════════════════════════════
// Safe zones, danger zones, and location-based alerts

const { findMany, findOne, insertOne, updateOne, deleteOne } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a safe zone
 */
function createSafeZone(userId, zoneData) {
  try {
    const safeZone = {
      id: uuidv4(),
      userId,
      name: zoneData.name,
      type: 'safe', // safe | danger
      latitude: zoneData.latitude,
      longitude: zoneData.longitude,
      radius: zoneData.radius || 500, // meters
      notifyOnEnter: zoneData.notifyOnEnter !== false,
      notifyOnExit: zoneData.notifyOnExit !== false,
      active: true,
      createdAt: new Date().toISOString()
    };

    insertOne('geofences', safeZone);

    return {
      success: true,
      message: `✅ Safe zone "${zoneData.name}" created`,
      safeZone
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a danger zone (for child safety mode)
 */
function createDangerZone(userId, zoneData) {
  try {
    const dangerZone = {
      id: uuidv4(),
      userId,
      name: zoneData.name,
      type: 'danger',
      latitude: zoneData.latitude,
      longitude: zoneData.longitude,
      radius: zoneData.radius || 200,
      notifyOnEnter: true,
      notifyOnExit: false,
      alertLevel: zoneData.alertLevel || 'high', // low | medium | high
      active: true,
      createdAt: new Date().toISOString()
    };

    insertOne('geofences', dangerZone);

    return {
      success: true,
      message: `⚠️ Danger zone "${zoneData.name}" created`,
      dangerZone
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user's geofences
 */
function getUserGeofences(userId) {
  try {
    const geofences = findMany('geofences', g => g.userId === userId && g.active);

    return {
      success: true,
      geofences: geofences.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type,
        latitude: g.latitude,
        longitude: g.longitude,
        radius: g.radius,
        notifyOnEnter: g.notifyOnEnter,
        notifyOnExit: g.notifyOnExit,
        alertLevel: g.alertLevel
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update geofence
 */
function updateGeofence(geofenceId, userId, updates) {
  try {
    const geofence = updateOne('geofences',
      g => g.id === geofenceId && g.userId === userId,
      updates
    );

    if (!geofence) {
      return { success: false, message: 'Geofence not found' };
    }

    return {
      success: true,
      message: 'Geofence updated',
      geofence
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete geofence
 */
function deleteGeofence(geofenceId, userId) {
  try {
    const deleted = deleteOne('geofences',
      g => g.id === geofenceId && g.userId === userId
    );

    if (!deleted) {
      return { success: false, message: 'Geofence not found' };
    }

    return {
      success: true,
      message: 'Geofence deleted'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if location is within a geofence
 */
function checkGeofence(userId, latitude, longitude) {
  try {
    const geofences = findMany('geofences', g => g.userId === userId && g.active);
    const results = [];

    for (const geofence of geofences) {
      const distance = calculateDistance(
        latitude, longitude,
        geofence.latitude, geofence.longitude
      );

      const isInside = distance <= geofence.radius;

      results.push({
        geofenceId: geofence.id,
        name: geofence.name,
        type: geofence.type,
        isInside,
        distance: Math.round(distance),
        alertLevel: geofence.alertLevel
      });
    }

    // Check for zone transitions
    const alerts = [];
    for (const result of results) {
      const geofence = geofences.find(g => g.id === result.geofenceId);
      
      // Get last known state
      const lastState = findOne('geofence_states',
        s => s.userId === userId && s.geofenceId === result.geofenceId
      );

      const wasInside = lastState?.isInside || false;

      // Detect transitions
      if (result.isInside && !wasInside && geofence.notifyOnEnter) {
        alerts.push({
          type: 'enter',
          geofence: result.name,
          zoneType: result.type,
          alertLevel: result.alertLevel
        });
      } else if (!result.isInside && wasInside && geofence.notifyOnExit) {
        alerts.push({
          type: 'exit',
          geofence: result.name,
          zoneType: result.type,
          alertLevel: result.alertLevel
        });
      }

      // Update state
      if (lastState) {
        updateOne('geofence_states',
          s => s.id === lastState.id,
          { isInside: result.isInside, lastChecked: new Date().toISOString() }
        );
      } else {
        insertOne('geofence_states', {
          id: uuidv4(),
          userId,
          geofenceId: result.geofenceId,
          isInside: result.isInside,
          lastChecked: new Date().toISOString()
        });
      }
    }

    return {
      success: true,
      results,
      alerts
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Process geofence alerts
 */
async function processGeofenceAlerts(userId, alerts) {
  try {
    if (alerts.length === 0) return { success: true, alertsSent: 0 };

    const user = findOne('users', u => u.id === userId);
    const contacts = findMany('contacts', c => c.userId === userId);
    const { sendSMS } = require('../utils/sms');

    let alertsSent = 0;

    for (const alert of alerts) {
      let message = '';

      if (alert.type === 'enter') {
        if (alert.zoneType === 'safe') {
          message = `✅ SHIELD: ${user.name} has entered safe zone "${alert.geofence}".`;
        } else if (alert.zoneType === 'danger') {
          message = `⚠️ SHIELD ALERT: ${user.name} has entered danger zone "${alert.geofence}"! ` +
            `Alert Level: ${alert.alertLevel.toUpperCase()}. Please check on them immediately.`;
        }
      } else if (alert.type === 'exit') {
        if (alert.zoneType === 'safe') {
          message = `⚠️ SHIELD: ${user.name} has left safe zone "${alert.geofence}".`;
        }
      }

      if (message) {
        // Send to contacts based on alert level
        const recipientContacts = alert.alertLevel === 'high' 
          ? contacts 
          : contacts.filter(c => c.priority === 1);

        for (const contact of recipientContacts) {
          await sendSMS(contact.phone, message);
          alertsSent++;
        }

        console.log(`📍 Geofence alert: ${user.name} - ${alert.type} ${alert.geofence}`);
      }
    }

    return {
      success: true,
      alertsSent
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get nearby safe zones (for recommendations)
 */
function getNearbySafeZones(latitude, longitude, radiusKm = 5) {
  try {
    const allSafeZones = findMany('geofences', g => g.type === 'safe' && g.active);
    const nearby = [];

    for (const zone of allSafeZones) {
      const distance = calculateDistance(
        latitude, longitude,
        zone.latitude, zone.longitude
      );

      if (distance <= radiusKm * 1000) {
        nearby.push({
          name: zone.name,
          distance: Math.round(distance),
          latitude: zone.latitude,
          longitude: zone.longitude
        });
      }
    }

    // Sort by distance
    nearby.sort((a, b) => a.distance - b.distance);

    return {
      success: true,
      nearbySafeZones: nearby.slice(0, 10) // Top 10
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Suggest safe zones based on user's frequent locations
 */
function suggestSafeZones(userId) {
  try {
    const locations = findMany('locations', l => l.userId === userId);

    if (locations.length < 10) {
      return {
        success: true,
        suggestions: [],
        message: 'Not enough location data for suggestions'
      };
    }

    // Cluster locations to find frequent places
    const clusters = clusterLocations(locations);

    const suggestions = clusters.map((cluster, index) => ({
      name: `Frequent Location ${index + 1}`,
      latitude: cluster.centerLat,
      longitude: cluster.centerLon,
      visits: cluster.count,
      suggestedRadius: Math.max(200, Math.min(cluster.radius, 1000))
    }));

    return {
      success: true,
      suggestions: suggestions.slice(0, 5) // Top 5
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Simple location clustering
 */
function clusterLocations(locations, threshold = 200) {
  const clusters = [];

  for (const location of locations) {
    let addedToCluster = false;

    for (const cluster of clusters) {
      const distance = calculateDistance(
        location.latitude, location.longitude,
        cluster.centerLat, cluster.centerLon
      );

      if (distance <= threshold) {
        cluster.count++;
        cluster.locations.push(location);
        // Recalculate center
        cluster.centerLat = cluster.locations.reduce((sum, l) => sum + l.latitude, 0) / cluster.locations.length;
        cluster.centerLon = cluster.locations.reduce((sum, l) => sum + l.longitude, 0) / cluster.locations.length;
        addedToCluster = true;
        break;
      }
    }

    if (!addedToCluster) {
      clusters.push({
        centerLat: location.latitude,
        centerLon: location.longitude,
        count: 1,
        locations: [location],
        radius: threshold
      });
    }
  }

  // Sort by visit count
  clusters.sort((a, b) => b.count - a.count);

  return clusters;
}

module.exports = {
  createSafeZone,
  createDangerZone,
  getUserGeofences,
  updateGeofence,
  deleteGeofence,
  checkGeofence,
  calculateDistance,
  processGeofenceAlerts,
  getNearbySafeZones,
  suggestSafeZones
};
