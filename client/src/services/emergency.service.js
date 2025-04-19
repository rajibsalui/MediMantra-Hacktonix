"use client";

import { API_URL } from "@/config/environment";

/**
 * Service for emergency-related API calls
 */
class EmergencyService {
  /**
   * Send emergency call to all nearby ambulances
   * @param {Object} data - Object containing location coordinates and patient phone
   * @returns {Promise} - Promise with the API response
   */
  async sendEmergencyCall(data) {
    try {
      console.log('Sending emergency call with data:', data);
      const response = await fetch(`${API_URL}/emergency/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send emergency call");
      }

      const responseData = await response.json();
      console.log('Emergency call response:', responseData);
      return responseData;
    } catch (error) {
      console.error("Error sending emergency call:", error);
      throw error;
    }
  }

  /**
   * Register a new ambulance with minimal information
   * @param {Object} ambulanceData - Object containing ambulance details
   * @returns {Promise} - Promise with the API response
   */
  async registerAmbulance(ambulanceData) {
    try {
      const response = await fetch(`${API_URL}/emergency/ambulances/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ambulanceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register ambulance");
      }

      return await response.json();
    } catch (error) {
      console.error("Error registering ambulance:", error);
      throw error;
    }
  }

  /**
   * Get all registered ambulances
   * @returns {Promise} - Promise with the API response
   */
  async getAllAmbulances() {
    try {
      const response = await fetch(`${API_URL}/emergency/ambulances`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch ambulances");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching ambulances:", error);
      throw error;
    }
  }
}

export default new EmergencyService();
