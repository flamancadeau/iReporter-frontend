import React, { useState, useEffect } from "react";
import {
  CircleAlert,
  MapPin,
  Trash2,
  Edit,
  FileText,
  Calendar,
  X,
  Search,
  HourglassIcon,
} from "lucide-react";
import axios from "axios";
import Button from "./components/Button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Types for Report
interface Report {
  id: string;
  type: "RED_FLAG" | "INTERVENTION";
  status: "draft" | "PENDING" | "UNDER_INVESTIGATION" | "REJECTED" | "RESOLVED";
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  incidentDate: string;
  reportDate: string;
  images: string[];
}

interface FormData extends Omit<Report, "id" | "status" | "location"> {
  latitude?: number;
  longitude?: number;
}

export default function ReportSystem() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manage");
  const [formData, setFormData] = useState<FormData>({
    type: "RED_FLAG",
    title: "",
    description: "",
    latitude: undefined,
    longitude: undefined,
    incidentDate: "",
    reportDate: new Date().toISOString().split("T")[0],
    images: [],
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await axios.get<{ reports: Report[] }>(
          `http://localhost:3000/report/${userId}`
        );
        setReports(response.data.reports);
      } catch (err) {
        console.error("Error fetching reports:", err);
        toast.error("Failed to fetch reports. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const canEditReport = (report: Report) => {
    return report.status === "PENDING" || report.status === "draft";
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const response = await axios.delete(`http://localhost:3000/report/${id}`);

      if (response.status === 200) {
        setReports((prevReports) =>
          prevReports.filter((report) => report.id !== id)
        );
        toast.success("Report deleted successfully");
      } else {
        throw new Error("Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report. Please try again.");
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingReport) return;

    try {
      if (!formData || Object.keys(formData).length === 0) {
        toast.error("No data to update");
        return;
      }

      const response = await axios.patch(
        `http://localhost:3000/report/${editingReport.id}`,
        formData
      );

      if (response.status === 200) {
        setReports(
          reports.map((report) =>
            report.id === editingReport.id ? { ...report, ...formData } : report
          )
        );

        setIsEditModalOpen(false);
        setEditingReport(null);

        toast.success("Report updated successfully");
      } else {
        throw new Error("Failed to update report");
      }
    } catch (error: any) {
      console.error("Error updating report:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update report";
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReport) {
      handleUpdate(e);
    } else {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          throw new Error("User is not logged in. User ID not found.");
        }

        const requestBody = {
          ...formData,
          userId: userId,
          location: {
            latitude: formData.latitude,
            longitude: formData.longitude,
          },
        };

        const response = await axios.post(
          "http://localhost:3000/report",
          requestBody
        );

        if (response.status === 201) {
          const newReport: Report = {
            id: response.data.newReport.id,
            status: "PENDING",
            ...formData,
            location: {
              latitude: formData.latitude || 0,
              longitude: formData.longitude || 0,
            },
          };
          setReports([...reports, newReport]);
          resetForm();
          toast.success("Report submitted successfully");
        } else {
          throw new Error("Failed to submit the report");
        }
      } catch (error) {
        console.error("Error creating report:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError("");

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setIsLoadingLocation(false);
          toast.success("Location fetched successfully");
        },
        (error) => {
          setLocationError(
            "Failed to get location. Please ensure location services are enabled."
          );
          setIsLoadingLocation(false);
          console.error("Geolocation error:", error);
          toast.error("Failed to get location. Please try again.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "RED_FLAG",
      title: "",
      description: "",
      latitude: undefined,
      longitude: undefined,
      incidentDate: "",
      reportDate: new Date().toISOString().split("T")[0],
      images: [],
    });
  };

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Report System</h1>

        <div className="mb-6">
          <div className="grid grid-cols-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("manage")}
              className={`py-2 px-4 rounded-lg font-medium ${
                activeTab === "manage"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Tracking your Reports
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`py-2 px-4 rounded-lg font-medium ${
                activeTab === "create"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Report Incident
            </button>
          </div>
        </div>

        {activeTab === "manage" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Manage Reports</h2>
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {filteredReports.length === 0 && (
              <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg text-center">
                <div className="flex justify-center mb-2">
                  <CircleAlert className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  No Reports Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "No reports match your search criteria."
                    : "You have no current red-flag or intervention reports to manage."}
                </p>
              </div>
            )}

            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 mb-4 flex items-center justify-between"
              >
                <div className="flex-grow">
                  <div className="flex items-center space-x-2">
                    {report.type === "RED_FLAG" ? (
                      <CircleAlert className="text-red-500 mr-2" />
                    ) : (
                      <FileText className="text-yellow-500 mr-2" />
                    )}
                    <span className="font-medium capitalize">
                      {report.type}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        report.status === "PENDING"
                          ? "bg-blue-100 text-blue-800"
                          : report.status === "UNDER_INVESTIGATION"
                          ? "bg-yellow-100 text-yellow-800"
                          : report.status === "RESOLVED"
                          ? "bg-green-100 text-green-800"
                          : report.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mt-2">{report.title}</h3>

                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(report.incidentDate)}
                  </div>

                  <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {report.description}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    Lat: {report.location.latitude}, Lon:{" "}
                    {report.location.longitude}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingReport(report);
                      setFormData({
                        ...report,
                        latitude: report.location.latitude,
                        longitude: report.location.longitude,
                      });
                      setIsEditModalOpen(true);
                    }}
                    disabled={!canEditReport(report)}
                    className={`p-2 rounded border ${
                      canEditReport(report)
                        ? "hover:bg-yellow-50 border-yellow-300 text-yellow-600"
                        : "cursor-not-allowed opacity-50 border-gray-300 text-gray-400"
                    }`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    disabled={!canEditReport(report)}
                    className={`p-2 rounded border ${
                      canEditReport(report)
                        ? "hover:bg-red-50 border-red-300 text-red-600"
                        : "cursor-not-allowed opacity-50 border-gray-300 text-gray-400"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "create" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Create New Report</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="RED_FLAG">Red-flag Record</option>
                  <option value="INTERVENTION">Intervention Record</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the incident or issue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date of Incident
                  </label>
                  <input
                    type="date"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Report Date
                  </label>
                  <input
                    type="date"
                    name="reportDate"
                    value={formData.reportDate}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Detailed Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide as much detail as possible..."
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium">
                      Geolocation
                    </label>
                    <MapPin className="w-4 h-4 mr-2" />
                    <Button
                      type="button"
                      onClick={getCurrentLocation}
                     
                    >
                      {isLoadingLocation
                        ? "Getting Location..."
                        : "Get Current Location"}
                    </Button>
                  </div>

                  {locationError && (
                    <div className="text-red-600 text-sm mb-4">
                      {locationError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Latitude
                      </label>
                      <input
                        type="text"
                        name="latitude"
                        value={formData.latitude?.toString() || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 51.5074"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Longitude
                      </label>
                      <input
                        type="text"
                        name="longitude"
                        value={formData.longitude?.toString() || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., -0.1278"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* <div>
                <label className="block text-sm font-medium mb-2">
                  Evidence Images
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400">
                  <div className="space-y-1 text-center">
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload files</span>
                        <input
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to 10MB each
                    </p>
                  </div>
                </div>
              </div> */}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Reset Form
                </button>
                <Button type="submit">Submit Report</Button>
              </div>
            </form>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
              <div className="flex justify-between items-center p-4 border-b border-gray-300">
                <h3 className="text-lg font-semibold text-gray-800">
                  Edit {editingReport?.type.replace("-", " ").toUpperCase()}{" "}
                  Report
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <form onSubmit={handleUpdate} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incident Date
                    </label>
                    <input
                      type="date"
                      name="incidentDate"
                      value={formData.incidentDate}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-1 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <Button type="submit">Update Report</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
