"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { API_URL } from "@/config/environment";

// Create context
const PatientContext = createContext();

// Custom hook to use patient context
export const usePatient = () => useContext(PatientContext);

export const PatientProvider = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [patientError, setPatientError] = useState(null);
  const [vitalStats, setVitalStats] = useState([]);

  // Configure axios with auth token
  const getAuthHeaders = () => {
    const currentToken = token || localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    };
  };

  // Fetch patient profile when authenticated
  useEffect(() => {
    const role = localStorage.getItem("Role");
    const storedToken = localStorage.getItem("token");
    const shouldFetchProfile = (isAuthenticated || storedToken) && role === "patient";

    // Set loading state to true at the beginning of the effect
    setProfileLoading(true);

    if (shouldFetchProfile) {
      // Set a small timeout to ensure UI shows loading state
      const loadingTimeout = setTimeout(() => {
        // Don't show toast on initial page load/refresh
        getPatientProfile(false);
      }, 300); // Small delay to ensure loading state is visible

      // Clean up timeout if component unmounts
      return () => clearTimeout(loadingTimeout);
    } else {
      // Reset loading state when not authenticated
      setProfileLoading(false);
    }
  }, [isAuthenticated, user, token]);

  // Get patient profile
  const getPatientProfile = async (showToast = false) => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) {
      console.warn("No authentication token available");
      setProfileLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setProfileLoading(true);
      setPatientError(null);
      const { data } = await axios.get(
        `${API_URL}/patients/profile`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        }
      );
      setPatient(data.data);
      return data.data;
    } catch (error) {
      // Only set error if the error is not 401 (unauthorized) during initial load
      const statusCode = error.response?.status;
      const message = error.response?.data?.message || "Failed to fetch patient profile";

      if (statusCode !== 401) {
        setPatientError(message);
        // Only show toast for errors that aren't authentication related and when explicitly requested
        if (showToast) {
          toast.error("Failed to fetch patient profile. Please try again.");
        } else {
          console.warn("Patient profile not found, but not showing toast on page load/refresh");
        }
      } else {
        console.warn("Authentication token expired or invalid");
      }
      console.error("Error fetching patient profile:", error);
      return null;
    } finally {
      setLoading(false);
      setProfileLoading(false);
    }
  };

  // Update patient profile
  const updatePatientProfile = async (profileData) => {
    console.log('updatePatientProfile called with:', profileData);

    if (!token) {
      console.error('No authentication token available');
      toast.error("Authentication required");
      throw new Error("No authentication token available");
    }

    try {
      setLoading(true);
      console.log('Making API request to update profile');
      console.log('API URL:', `${API_URL}/patients/profile`);
      console.log('Headers:', getAuthHeaders());

      // Create a copy of the data to avoid mutation issues
      const dataToSend = JSON.parse(JSON.stringify(profileData));

      const { data } = await axios.put(
        `${API_URL}/patients/profile`,
        dataToSend,
        getAuthHeaders()
      );

      console.log('Profile update API response:', data);
      setPatient(data.data);
      toast.success("Profile updated successfully");
      return data.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      const message = error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Get patient appointments
  const getPatientAppointments = async (filters = {}) => {
    if (!token) {
      toast.error("Authentication required");
      throw new Error("No authentication token available");
    }

    try {
      setAppointmentsLoading(true);
      // Construct query params from filters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const { data } = await axios.get(
        `${API_URL}/patients/appointments?${params.toString()}`,
        getAuthHeaders()
      );
      setAppointments(data.data);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch appointments";
      toast.error(message);
      throw new Error(message);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Book appointment
  const bookAppointment = async (appointmentData) => {
    if (!token) {
      toast.error("Authentication required");
      throw new Error("No authentication token available");
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${API_URL}/patients/appointments`,
        appointmentData,
        getAuthHeaders()
      );
      // Refresh appointments list
      getPatientAppointments();
      toast.success("Appointment booked successfully");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to book appointment";
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId, reason) => {
    if (!token) {
      toast.error("Authentication required");
      throw new Error("No authentication token available");
    }

    try {
      setLoading(true);
      const { data } = await axios.put(
        `${API_URL}/patients/appointments/${appointmentId}/cancel`,
        { reason },
        getAuthHeaders()
      );
      // Refresh appointments list
      getPatientAppointments();
      toast.success("Appointment cancelled successfully");
      return data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to cancel appointment";
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Update profile image
  const updateProfileImage = async (formData) => {
    if (!token) {
      toast.error("Authentication required");
      throw new Error("No authentication token available");
    }

    try {
      setLoading(true);
      const config = {
        ...getAuthHeaders(),
        headers: {
          ...getAuthHeaders().headers,
          'Content-Type': 'multipart/form-data'
        }
      };

      const { data } = await axios.put(
        `${API_URL}/patients/profile-image`,
        formData,
        config
      );
      // Update patient state with new image - don't show error toast if this fails
      await getPatientProfile(false);
      toast.success("Profile image updated successfully");
      return data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update profile image";
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Add these methods to match what your dashboard might need
  const fetchPatientProfile = async (userId) => {
    // Don't show toast on dashboard load
    return await getPatientProfile(false);
  };

  const fetchUpcomingAppointments = async (userId) => {
    try {
      const response = await getPatientAppointments({ status: 'upcoming' });
      // Ensure we return an array of appointments
      return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      return [];
    }
  };

  const fetchMedicalRecords = async (userId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_URL}/patients/medical-records`,
        getAuthHeaders()
      );
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch medical records";
      console.error("Error fetching medical records:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalStats = async (userId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_URL}/patients/vital-stats`,
        getAuthHeaders()
      );
      setVitalStats(data.data || []);
      return data.data || [];
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch vital statistics";
      console.error("Error fetching vital stats:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add vital statistics
  const addVitalStats = async (vitalData) => {
    if (!token) {
      toast.error("Authentication required");
      throw new Error("No authentication token available");
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${API_URL}/patients/vital-stats`,
        vitalData,
        getAuthHeaders()
      );

      // Update local state
      const updatedVitalStats = [...(vitalStats || []), data.data];
      setVitalStats(updatedVitalStats);

      toast.success("Vital statistics recorded successfully");
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to record vital statistics";
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patient,
        patientProfile: patient, // Alias for dashboard compatibility
        appointments,
        upcomingAppointments: appointments?.filter(apt => apt.status === 'upcoming') || [], // For dashboard
        loading,
        profileLoading, // Add the specific loading state to the context
        appointmentsLoading,
        error: patientError,
        getPatientProfile,
        updatePatientProfile,
        getPatientAppointments,
        bookAppointment,
        cancelAppointment,
        updateProfileImage,
        // Added for dashboard compatibility
        fetchPatientProfile,
        fetchUpcomingAppointments,
        fetchMedicalRecords,
        fetchVitalStats,
        addVitalStats,
        medicalRecords: null, // Will be populated by fetchMedicalRecords
        vitalStats, // Will be populated by fetchVitalStats,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export default PatientContext;