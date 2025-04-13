"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import emergencyService from "@/services/emergency.service";

export default function AmbulanceRegistrationForm() {
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    vehicleNumber: "",
    vehicleType: "basic",
    latitude: "",
    longitude: "",
    driverName: "",
    driverContact: "",
    address: "",
    city: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, vehicleType: value }));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));

          toast({
            title: "Location detected",
            description: "Your current location has been added to the form.",
            variant: "success",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location error",
            description: "Unable to get your location. Please enter coordinates manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation. Please enter coordinates manually.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await emergencyService.registerAmbulance(formData);

      setSuccess(true);
      toast({
        title: "Registration successful",
        description: "The ambulance has been registered successfully.",
        variant: "success",
      });

      // Reset form after successful submission
      setFormData({
        name: "",
        contactNumber: "",
        vehicleNumber: "",
        vehicleType: "basic",
        latitude: "",
        longitude: "",
        driverName: "",
        driverContact: "",
        address: "",
        city: ""
      });
    } catch (error) {
      console.error("Error registering ambulance:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register ambulance. Please try again.",
        variant: "destructive",
      });
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
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="10-digit phone number"
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
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Select
              value={formData.vehicleType}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="patient-transport">Patient Transport</SelectItem>
                <SelectItem value="neonatal">Neonatal</SelectItem>
                <SelectItem value="air">Air Ambulance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="28.6139"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="77.2090"
                required
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGetLocation}
          >
            Get Current Location
          </Button>

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

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City (Optional)</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Delhi"
            />
          </div>

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
