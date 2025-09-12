import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>Select a section:</p>
      <ul className="list-disc list-inside">
        <li><Link href="/admin/dashboard">📊 Dashboard</Link></li>
        <li><Link href="/admin/files">📂 Files</Link></li>
        <li><Link href="/admin/attendance">📝 Attendance</Link></li>
        <li><Link href="/admin/invites">🔑 Invites</Link></li>
      </ul>
    </div>
  );
}
