"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import emergencyService from "@/services/emergency.service";

export default function EmergencyButton({ id }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
  };

  const handleEmergencyClick = () => {
    setIsDialogOpen(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to get your location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleConfirmEmergency = async () => {
    if (!location) {
      setError("Location is required to send emergency calls.");
      return;
    }

    setIsLoading(true);
    try {
      // Get user's phone number if available, or prompt for it
      let patientPhone = prompt("Please enter your phone number for the ambulance to call you back:");

      const emergencyData = {
        ...location,
        patientPhone
      };

      const response = await emergencyService.sendEmergencyCall(emergencyData);
      console.log(response);
      
      setAmbulances(response.ambulances);

      showNotification(`Emergency call sent! Alert sent to ${response.count} ambulances in your area.`, "success");
    } catch (error) {
      console.error("Error sending emergency call:", error);

      // If no ambulances found, show a more specific error
      if (error.message && error.message.includes("No ambulances")) {
        setError("No ambulances found in the system. Please register ambulances first.");
        showNotification("No ambulances found in the system. Please register ambulances first.", "error");
      } else {
        setError(error.message || "Failed to send emergency call. Please try again.");
        showNotification(error.message || "Failed to send emergency call. Please try again or call emergency services directly.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to initiate a call to the ambulance driver
  const callAmbulance = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50"
          >
            <div
              className={`alert ${
                notification.type === "success"
                  ? "alert-success"
                  : notification.type === "error"
                  ? "alert-error"
                  : "alert-info"
              } shadow-lg`}
            >
              <div>
                {notification.type === "success" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
                <span>{notification.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          id={id}
          onClick={handleEmergencyClick}
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 px-3 py-1"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Emergency
        </Button>
        <motion.span
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
          }}
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"
        />
      </motion.div>

      <AnimatePresence>
        {isDialogOpen && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center text-red-600 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  Emergency Services
                </DialogTitle>
                <DialogDescription className="text-center">
                  This will send an emergency alert to all ambulances within 5km of your current location.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {ambulances.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    Emergency call sent successfully! Help is on the way.
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Ambulances notified:</h3>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {ambulances.map((ambulance) => (
                        <li key={ambulance._id} className="text-sm bg-gray-50 p-2 rounded-md">
                          <div className="font-medium">{ambulance.name}</div>
                          <div className="text-gray-500 text-xs">
                            Vehicle: {ambulance.vehicleNumber} ({ambulance.vehicleType})
                          </div>
                          <div className="text-gray-500 text-xs">
                            Distance: {ambulance.distance} km
                          </div>
                          <div className="text-gray-500 text-xs">
                            Driver: {ambulance.driverName}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Contact: {ambulance.driverContact || ambulance.contactNumber}
                          </div>
                          <div className="mt-2">
                            <a
                              href={`tel:${ambulance.driverContact || ambulance.contactNumber}`}
                              className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              onClick={() => callAmbulance(ambulance.driverContact || ambulance.contactNumber)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Call Driver
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <p className="mb-4 text-center font-medium">
                    Are you sure you want to send an emergency alert?
                  </p>

                  {location ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                      Your location has been detected. Emergency services will be directed to your current position.
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Detecting your location...
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
                {ambulances.length > 0 ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:w-auto"
                      disabled={isLoading || !location}
                      onClick={handleConfirmEmergency}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Alert...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Send Emergency Alert
                        </>
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
