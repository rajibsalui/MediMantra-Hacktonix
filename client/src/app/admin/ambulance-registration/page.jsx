"use client";

import React from "react";
import AmbulanceRegistrationForm from "@/components/emergency/AmbulanceRegistrationForm";

export default function AmbulanceRegistrationPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Ambulance Registration</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Register a new ambulance for emergency services with minimal information
          </p>
        </div>
        
        <AmbulanceRegistrationForm />
        
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Important Information</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>All registered ambulances will be available for emergency calls</li>
            <li>Make sure to provide accurate location coordinates for proper distance calculation</li>
            <li>The contact number will be used to notify the ambulance service during emergencies</li>
            <li>You can use the "Get Current Location" button to automatically fill in your current coordinates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
