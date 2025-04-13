"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, MapPin } from "lucide-react";
import Link from "next/link";
import emergencyService from "@/services/emergency.service";

export default function AmbulancesPage() {
  const [ambulances, setAmbulances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const fetchAmbulances = async () => {
    try {
      setIsLoading(true);
      const response = await emergencyService.getAllAmbulances();
      setAmbulances(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching ambulances:", error);
      setError(error.message || "Failed to fetch ambulances");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Registered Ambulances</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage all registered ambulances for emergency services
            </p>
          </div>
          <Link href="/admin/ambulance-registration">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register New
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ambulance List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Loading ambulances...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md">
                {error}
              </div>
            ) : ambulances.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No ambulances registered yet</p>
                <Link href="/admin/ambulance-registration">
                  <Button>Register Your First Ambulance</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ambulances.map((ambulance) => (
                      <TableRow key={ambulance._id}>
                        <TableCell className="font-medium">{ambulance.name}</TableCell>
                        <TableCell>{ambulance.vehicleNumber}</TableCell>
                        <TableCell>
                          <span className="capitalize">{ambulance.vehicleType}</span>
                        </TableCell>
                        <TableCell>{ambulance.contactNumber}</TableCell>
                        <TableCell>{ambulance.driver?.name}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const lat = ambulance.location.coordinates[1];
                              const lng = ambulance.location.coordinates[0];
                              window.open(
                                `https://www.google.com/maps?q=${lat},${lng}`,
                                "_blank"
                              );
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            View Map
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
