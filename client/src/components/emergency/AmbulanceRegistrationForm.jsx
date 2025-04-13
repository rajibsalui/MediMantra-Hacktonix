"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import emergencyService from "@/services/emergency.service";
import { useRouter } from "next/navigation";

export default function AmbulanceRegistrationForm() {
  const [formData, setFormData] = useState({
    name: "",
    vehicleNumber: "",
    driverName: "",
    driverContact: "",
    latitude: "",
    longitude: ""
  });

  // Get location on component mount
  useEffect(() => {
    getLocationFromBrowser();
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [locationMessage, setLocationMessage] = useState(null);
   const navigate=useRouter()
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getLocationFromBrowser = () => {
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));

          setLocationMessage({
            type: "success",
            text: "Your location has been detected automatically."
          });

          // Clear message after 3 seconds
          setTimeout(() => setLocationMessage(null), 3000);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to get your location. Please try again.");
          setLocationMessage({
            type: "error",
            text: "Unable to get your location. Please try again."
          });

          // Clear message after 3 seconds
          setTimeout(() => setLocationMessage(null), 3000);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLocationMessage({
        type: "error",
        text: "Your browser doesn't support geolocation. Please try on a different device."
      });

      // Clear message after 3 seconds
      setTimeout(() => setLocationMessage(null), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Check if location is available
    if (!formData.latitude || !formData.longitude) {
      setError("Location is required. Please wait for location detection or try again.");
      setIsLoading(false);
      return;
    }

    try {
      await emergencyService.registerAmbulance(formData);

      setSuccess(true);
      setLocationMessage({
        type: "success",
        text: "The ambulance has been registered successfully."
      });

      // Reset form after successful submission
      setFormData({
        name: "",
        vehicleNumber: "",
        driverName: "",
        driverContact: "",
        latitude: "",
        longitude: ""
      });

      // Get location again for the next registration
      setTimeout(() => {
        getLocationFromBrowser();
      }, 1000);

      navigate.push("/")

    } catch (error) {
      console.error("Error registering ambulance:", error);
      setError(error.message || "Failed to register ambulance. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register Ambulance</CardTitle>
        <CardDescription>
          Enter the details below to register a new ambulance for emergency services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {locationMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            locationMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {locationMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ambulance Name/Service</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="City Emergency Services"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
            <Input
              id="vehicleNumber"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              placeholder="DL01AB1234"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverName">Driver Name</Label>
            <Input
              id="driverName"
              name="driverName"
              value={formData.driverName}
              onChange={handleChange}
              placeholder="Full name of driver"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverContact">Driver Contact</Label>
            <Input
              id="driverContact"
              name="driverContact"
              value={formData.driverContact}
              onChange={handleChange}
              placeholder="10-digit phone number"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-md text-sm">
            <p className="font-medium">Location: {formData.latitude && formData.longitude ?
              `${formData.latitude}, ${formData.longitude}` :
              "Detecting your location..."}
            </p>
            <p className="mt-1 text-xs">Your current location will be used for emergency services.</p>
            {(!formData.latitude || !formData.longitude) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={getLocationFromBrowser}
              >
                Retry Location Detection
              </Button>
            )}
          </div>

          <input type="hidden" name="latitude" value={formData.latitude} />
          <input type="hidden" name="longitude" value={formData.longitude} />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Ambulance"
            )}
          </Button>
        </form>
      </CardContent>
      {success && (
        <CardFooter className="bg-green-50 border-t border-green-100 text-green-700 p-4">
          Ambulance registered successfully! You can register another one or close this form.
        </CardFooter>
      )}
    </Card>
  );
}