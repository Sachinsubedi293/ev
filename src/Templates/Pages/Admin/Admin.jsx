import React, { useState, useEffect } from "react";
import axios from "axios";
// import BarChart from "./components/Chart";
import Cookies from "js-cookie";
import { io } from "socket.io-client";



const Admin = () => {

  const [userCount, setUserCount] = useState(1);
  const [password, setPassword] = useState("password");
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isExamIsRunning, setIsExamIsRunning] = useState(false);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [examName, setExamName] = useState("");
  const [previousExams, setPreviousExams] = useState([]);
  // const [viewAll, setViewAll] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchExams();
  },);

  const fetchExams = async () => {
    console.log(isExamIsRunning);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/allexam`
      );
      setPreviousExams(res.data);
      calculateRunning(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const calculateRunning = (exams) => {
    const filtered = exams.filter((a, b) => a.date > b.date);
    if (Date(filtered[0].date + filtered[0].duration) > new Date()) {
      setIsExamIsRunning(true);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/students`
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch Students:", error);
    }
  };

  const handleCreateUsers = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const accessToken = Cookies.get("accessToken");
      const response = await axios.post(
        `${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/students`,
        {
          userCount: userCount,
          usernamePattern: username,
          password: password,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.status === 200) {
        alert(`${userCount} Students created successfully...`);
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to create students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    const confirmation = window.confirm(
      "Are you sure you want to delete all Students?"
    );
    if (confirmation) {
      try {
        const accessToken = Cookies.get("accessToken");
        const response = await axios.delete(
          `${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/delstudents/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (response.status === 200) {
          alert("Students deleted successfully.");
          fetchUsers();
        }
      } catch (error) {
        console.error("Failed to delete users:", error);
      }
    }
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
  };

  const handleDeleteExam = async (examId) => {
    const confirmation = window.confirm(
      "Are you sure you want to delete this Exam?"
    );
    if (confirmation) {
      try {
        const accessToken = Cookies.get("accessToken");
        const response = await axios.delete(
          `${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/delexam/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            data: { examid: examId },
          }
        );
        if (response.status === 200) {
          alert("Exam deleted successfully.");
          fetchExams();
        }
      } catch (error) {
        console.error("Failed to delete exam:", error);
      }
    }
  };

  const handleSubmitExam = async (event) => {
    event.preventDefault();
    try {
      const currentTime = new Date();
      const minStartTime = new Date(currentTime.getTime() + 2 * 60000);

      const startDateTimeObj = new Date(startDateTime);
      const endDateTimeObj = new Date(endDateTime);

      if (!examName) {
        alert("Enter a valid exam name");
        return false;
      }

      if (!startDateTime) {
        alert("Enter a valid start date and time");
        return false;
      }

      if (!endDateTime) {
        alert("Enter a valid end date and time");
        return false;
      }

      if (startDateTimeObj <= minStartTime) {
        alert("Start time must be at least 2 minutes from the current time");
        return false;
      }

      if (endDateTimeObj <= startDateTimeObj) {
        alert("End time must be after the start time");
        return false;
      }

      if (endDateTimeObj - startDateTimeObj < 60000) {
        alert("End time must be at least 1 minute after the start time");
        return false;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/exam`,
        {
          startDate: startDateTime,
          endDate: endDateTime,
          name: examName,
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("accessToken")}`,
          },
        }
      );

      console.log(response);
      if (response.status === 201) {
        alert("Exam Added Successfully");
        const newSocket = io(`${process.env.REACT_APP_BACEND_URL_CUSTOM}`);
        newSocket.emit("examCreated", { examId: "dswada" });
        fetchExams();
      }
    } catch (error) {
      console.error("Failed to start the exam:", error);
    }
  };


  useEffect(() => {
    const socket = io(`${process.env.REACT_APP_BACEND_URL_CUSTOM}`);
    socket.on("connect", () => {
      console.log("Connected to server");
    });
    socket.on("message", (data) => {
      console.log("Message received:", data);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-8">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto p-8">
          <div className="sticky top-0 bg-white py-4 px-8 mb-8 rounded-lg shadow-lg z-10">
            <div className="flex justify-between items-center">
              <div className="capitalize">MCQS</div>
              <div className="normal-case">
                Hello{" "}
                <span className="text-green-600 font-bold">@admin123</span>
              </div>
            </div>
          </div>
          {/* {isExamIsRunning && !Position ? (
            "Exam is Running"
          ) : (
            <div className="p-4">
              <h1 className="text-2xl font-semibold">Latest Exam, DATE</h1>
              <BarChart data={Position} />
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full bg-blue-200 border border-gray-200 shadow-md rounded-lg">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                        Position
                      </th>
                      <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                        Username
                      </th>
                      <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                        Marks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Position.labels.map((label, index) => (
                      <tr key={label} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-sm">
                          {index + 1}
                        </td>
                        <td className="py-2 px-4 border-b text-sm">{label}</td>
                        <td className="py-2 px-4 border-b text-sm">
                          {Position.values[index]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {Position.labels.length > 3 && (
                  <div className="mt-2 w-full flex justify-end">
                    <button
                      className="text-blue-500 hover:text-blue-700 font-semibold"
                      onClick={() => setViewAll(!viewAll)}
                    >
                      {viewAll ? "Show Less" : "View All"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )} */}

          <div className="w-full px-4 mb-8">
            <div className="bg-purple-200 rounded-lg p-4">
              <form>
                <h2 className="text-xl font-bold mb-4">Start New Exam</h2>
                <div className="mb-4">
                  <label
                    className="block text-sm font-bold mb-2"
                    htmlFor="examName"
                  >
                    Exam Name
                  </label>
                  <input
                    type="text"
                    id="examName"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-sm font-bold mb-2"
                    htmlFor="startDateTime"
                  >
                    Start Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startDateTime"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-sm font-bold mb-2"
                    htmlFor="endDateTime"
                  >
                    End Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endDateTime"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <button
                  type="submit"
                  onClick={handleSubmitExam}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-semibold"
                >
                  Start Exam
                </button>
              </form>
            </div>
          </div>

          {/* Previous Exams Section */}
          <div className="bg-red-200 container mx-auto px-4 rounded-lg py-8 my-6">
            <div className="flex flex-wrap justify-center">
              {/* Left section for Previous Exams */}
              <div className="w-full lg:w-1/2 px-4 mb-8">
                <div className="bg-yellow-200 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <h2 className="text-xl font-bold mb-4">Previous Exams</h2>
                    <table className="min-w-full bg-yellow-200 border border-gray-200 shadow-md rounded-lg">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                            Exam Name
                          </th>
                          <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                            Date
                          </th>
                          <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                            Duration
                          </th>
                          <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {previousExams.map((exam) => (
                          <tr key={exam.id} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b text-sm">
                              {exam.name}
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              {exam.date}
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              {exam.duration}
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              <button
                                className="px-2 py-1 bg-red-300"
                                onClick={() => handleDeleteExam(exam._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right section for creating new users */}
              <div className="w-full lg:w-1/2 px-4 mb-8">
                <div className="bg-green-200 rounded-lg p-4">
                  <h2 className="text-xl font-bold mb-4">Create New Users</h2>
                  <form onSubmit={handleCreateUsers}>
                    <div className="mb-4">
                      <label
                        className="block text-sm font-bold mb-2"
                        htmlFor="usernamePattern"
                      >
                        Username Pattern
                      </label>
                      <input
                        type="text"
                        id="usernamePattern"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        className="block text-sm font-bold mb-2"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="mt-2 text-blue-500 hover:text-blue-700 font-semibold"
                      >
                        {showPassword ? "Hide" : "Show"} Password
                      </button>
                    </div>
                    <div className="mb-4">
                      <label
                        className="block text-sm font-bold mb-2"
                        htmlFor="userCount"
                      >
                        Number of Users
                      </label>
                      <input
                        type="number"
                        id="userCount"
                        value={userCount}
                        onChange={(e) => setUserCount(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="1"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      {loading ? "Creating..." : "Create Users"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Users List */}
              <div className="w-full px-4 mb-8">
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="flex flex-row justify-between py-2 align-middle justify-items-center text-center">
                    <h2 className="text-xl font-bold mb-4 ">Users List</h2>
                    <button
                      className="bg-red-200 px-2 py-1 my-1 "
                      onClick={handleDeleteUser}
                    >
                      Delete All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                            Username
                          </th>
                          <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                            Password
                          </th>
                          <th className="py-2 px-4 border-b bg-gray-100 text-left text-sm font-semibold text-gray-600">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.username} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b text-sm">
                              {user.username}
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              {user.password}
                            </td>
                            <td className="py-2 px-4 border-b text-sm">
                              <button
                                className="px-2 py-1 bg-red-300"
                                onClick={() => handleDeleteUser(user.username)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout}>Login</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
