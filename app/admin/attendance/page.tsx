"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { parseUnits } from "viem";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Mint {
  wallet: string;
  event: string;
  time: string;
  txHash: string;
}

export default function AdminAttendancePage() {
  const [mints, setMints] = useState<Mint[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/data/mints.json")
      .then((res) => res.json())
      .then(setMints)
      .catch((err) => console.error("Error fetching mints:", err));
  }, []);

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

  return (
    <div className="container mx-auto p-4">
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
