import React, { useState, useEffect } from "react";
import {
  HourglassIcon,
  SearchIcon,
  XCircle,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type ReportStatus = "PENDING" | "UNDER_INVESTIGATION" | "REJECTED" | "RESOLVED";

interface Report {
  id: number;
  title: string;
  description: string;
  incidentDate: string;
  status: ReportStatus;
}

const statusOptions = [
  { value: "PENDING", label: "Pending", color: "yellow" },
  { value: "UNDER_INVESTIGATION", label: "Under Investigation", color: "blue" },
  { value: "RESOLVED", label: "Resolved", color: "green" },
  { value: "REJECTED", label: "Rejected", color: "red" },
];

const StatusIcon: Record<ReportStatus, React.ReactNode> = {
  PENDING: <HourglassIcon className="w-6 h-6 text-yellow-500" />,
  UNDER_INVESTIGATION: <AlertCircle className="w-6 h-6 text-blue-500" />,
  RESOLVED: <CheckCircle className="w-6 h-6 text-green-500" />,
  REJECTED: <XCircle className="w-6 h-6 text-red-500" />,
};

export default function AdminDashboard() {
  const [reportsData, setReportsData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "All">("All");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get<{ reports: Report[] }>(
        "http://localhost:3000/reports"
      );
      setReportsData(response.data.reports);
      setError(null);
      // toast.success("Reports fetched successfully");
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports. Please try again later.");
      toast.error("Failed to fetch reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: ReportStatus) => {
    try {
      const response = await axios.put(`http://localhost:3000/report/${id}`, {
        status: newStatus,
      });
      if (response.status === 200) {
        setReportsData((prevReports) =>
          prevReports.map((report) =>
            report.id === id ? { ...report, status: newStatus } : report
          )
        );
        toast.success("Status updated successfully");
      }
    } catch (error) {
      console.error("Error updating report status:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Failed to update status: ${error.response.data.error || error.response.data.message}`);
      } else {
        toast.error("Failed to update status. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <HourglassIcon className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg font-medium text-gray-700">
            Loading reports...
          </p>
          <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredReports = reportsData.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || report.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ReportStatus) => {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption ? statusOption.color : "gray";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="container mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Reports Dashboard
          </h1>
          <div className="flex space-x-4">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border rounded-lg"
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as ReportStatus | "All")
              }
              className="border rounded-lg p-3"
            >
              <option value="All">All Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid gap-4">
          {filteredReports.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No reports found matching your criteria.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className={`bg-white shadow-md rounded-lg p-6 flex items-center justify-between hover:shadow-lg transition-shadow border-l-4 border-${getStatusColor(
                  report.status
                )}-500`}
              >
                <div className="flex-grow mr-4">
                  <div className="flex items-center mb-2">
                    <span className="text-xl text-gray-700 mr-2">
                      {StatusIcon[report.status]}
                    </span>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {report.title}
                    </h2>
                  </div>
                  <div
                    className={`p-4 rounded-lg mb-4 bg-${getStatusColor(
                      report.status
                    )}-100 border-${getStatusColor(report.status)}-300 border`}
                  >
                    <p className="text-gray-600 mb-2">{report.description}</p>
                    <div className="text-sm text-gray-500">
                      Incident Date:{" "}
                      <span className="font-bold">
                        {new Date(report.incidentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <select
                    value={report.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as ReportStatus;
                      handleStatusChange(report.id, newStatus);
                    }}
                    className={`border rounded px-3 py-2 text-${getStatusColor(
                      report.status
                    )}-500 border-${getStatusColor(report.status)}-500`}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}