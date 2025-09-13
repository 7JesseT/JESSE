"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

interface Mint {
  wallet: string;
  event: string;
  time: string;
  txHash: string;
}

export default function AdminAttendancePage() {
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mints, setMints] = useState<Mint[]>([]);
  const [search, setSearch] = useState("");

  // Check authorization
  useEffect(() => {
    const checkAuth = () => {
      const urlKey = searchParams?.get('admin');
      const storedKey = localStorage.getItem('adminKey');
      
      if (urlKey === 'base-daily-admin-2024' || storedKey === 'base-daily-admin-2024') {
        setIsAuthorized(true);
        if (urlKey === 'base-daily-admin-2024') {
          localStorage.setItem('adminKey', 'base-daily-admin-2024');
        }
      } else {
        setIsAuthorized(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthorized) return;
    
    fetch("/data/mints.json")
      .then((res) => res.json())
      .then(setMints)
      .catch((err) => console.error("Error fetching mints:", err));
  }, [isAuthorized]);

  const filtered = mints.filter(
    (m) =>
      m.wallet.toLowerCase().includes(search.toLowerCase()) ||
      m.event.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const csv = [
      ["Wallet", "Event", "Time", "Tx Hash"],
      ...filtered.map((m) => [m.wallet, m.event, m.time, m.txHash]),
    ]
      .map((row) => row.map((val) => `"${val}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-mints.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-md mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Not authorized. Please provide a valid admin key via URL parameter or localStorage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin - Attendance</h1>
            <p className="text-muted-foreground">
              View event attendance and mint records
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              localStorage.removeItem('adminKey');
              setIsAuthorized(false);
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Mints (Admin)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <Input
              placeholder="Search by wallet or event"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleExportCSV} className="ml-auto w-fit">
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Wallet</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-2 text-center text-muted-foreground">
                      No mints found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 break-all">{m.wallet}</td>
                      <td className="p-2">{m.event}</td>
                      <td className="p-2">{new Date(m.time).toLocaleString()}</td>
                      <td className="p-2 break-all">{m.txHash}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
