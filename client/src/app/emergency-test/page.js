"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Phone } from "lucide-react";
import EmergencyButton from "@/components/emergency/EmergencyButton";

export default function EmergencyTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Emergency Call Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Emergency Button Test
            </CardTitle>
            <CardDescription>
              Test the emergency button functionality that uses Langchain.js and Twilio to automatically call ambulances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Your Phone Number (for callback)</Label>
                <Input 
                  id="phone" 
                  placeholder="+91 98765 43210" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  If provided, actual calls will be initiated to ambulance drivers.
                </p>
              </div>
              
              <div className="pt-4">
                <EmergencyButton id="test-emergency-button" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <p className="text-sm text-gray-500">
              This test will find all ambulances within 5km of your current location and initiate calls to them.
            </p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              How It Works
            </CardTitle>
            <CardDescription>
              Understanding the emergency call system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">1. Location Detection</h3>
                <p className="text-sm text-gray-500">
                  When you click the emergency button, your browser will request your current location.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">2. Finding Nearby Ambulances</h3>
                <p className="text-sm text-gray-500">
                  The system searches for all ambulances within a 5km radius of your location.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">3. Automatic Calling with Langchain.js</h3>
                <p className="text-sm text-gray-500">
                  If you provide your phone number, Langchain.js generates a context-aware emergency message.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">4. Twilio Integration</h3>
                <p className="text-sm text-gray-500">
                  Twilio initiates actual phone calls and SMS messages to ambulance drivers with your emergency details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
