import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import axios from "axios";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const MCQPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [questions, setQuestions] = useState([]);
  const questionsPerPage = 10;
  const questionRefs = useRef([]);
  const [targetQuestionIndex, setTargetQuestionIndex] = useState(null);

  const [examRunning, setExamRunning] = useState(null);
  const [answers, setAnswers] = useState({});
  const [disabled, setDisabled] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prevSeconds) => (prevSeconds > 0 ? prevSeconds - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchServerTime();
    fetchExam();
    fetchQuestions();
    // eslint-disable-next-line
  }, []);

  const fetchServerTime = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/server-time`);
      const serverTime = new Date(response.data.serverTime).getTime();
      const clientTime = Date.now();
      setServerTimeOffset(serverTime - clientTime);
    } catch (error) {
      console.error("Error fetching server time:", error);
    }
  };

  const getServerAdjustedTime = () => {
    return new Date(Date.now() + serverTimeOffset);
  };

  const fetchQuestions = () => {
    axios
      .get(`${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/questions/`, {
        headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` },
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setQuestions(res.data);
        } else {
          setQuestions([]);
        }
      })
      .catch((err) => {
        setQuestions([]);
        console.error(err);
      });
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
  };

  const fetchExam = () => {
    axios
      .get(`${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/exam/`, {
        headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` },
      })
      .then((res) => {
        console.log("Exam:", res.data);
        setExamRunning(res.data[0]);
        console.log(res.data[0]._id);
        Cookies.set("ExamId", res.data[0]._id);
        const examEndDate = new Date(res.data[0]?.endDate).getTime();
        const examDurationInSeconds = (examEndDate - getServerAdjustedTime().getTime()) / 1000;
        setSecondsLeft(Math.max(0, examDurationInSeconds));
      })
      .catch((err) => {
        console.error(err);
        setExamRunning(null);
        alert(err.response?.data?.error || "Failed to fetch exam");
      });
  };

  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_BACEND_URL_CUSTOM}`);

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      newSocket.emit("joinExam", examRunning?._id || "");
    });

    newSocket.on("ExamStarted", (data) => {
      console.log("Exam started", data);
      fetchQuestions();
      setDisabled(false);
      fetchExam();
      setAnsweredQuestions(new Set());
      setAnswers({});
    });

    newSocket.on("ExamCreated", (data) => {
      console.log("Exam Created", data);
      fetchQuestions();
      fetchExam();
      setAnsweredQuestions(new Set());
      setAnswers({});
    });

    newSocket.on("ExamComplete", (data) => {
      console.log("Exam completed", data);

      setDisabled(true);

      setTimeout(() => {
        handleSubmit();
      }, 30000);
    });

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  const indexOfFirstQuestion = (currentPage - 1) * questionsPerPage;
  const indexOfLastQuestion = currentPage * questionsPerPage;

  const handleNextPage = () => setCurrentPage((prevPage) => prevPage + 1);
  const handlePrevPage = () =>
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));

  const handleRadioChange = (questionId, index, selectedOption) => {
    const adjustedIndex = index + 1 + (currentPage - 1) * questionsPerPage;
    setAnsweredQuestions((prevAnsweredQuestions) =>
      new Set(prevAnsweredQuestions).add(adjustedIndex)
    );

    setAnswers((prevAnswers) => {
      const updatedAnswers = { ...prevAnswers };
      updatedAnswers[questionId] = selectedOption;
      console.log("Updated Answers: ", updatedAnswers);
      return updatedAnswers;
    });
  };

  const handleSubmit = () => {
    const answersToSend = {};
    questions.forEach((question, index) => {
      const questionId = question._id;
      const userAnswer = answers[questionId];
      if (userAnswer) {
        answersToSend[questionId] = userAnswer;
      }
    });
    const decoded=jwtDecode(Cookies.get("accessToken"));
    if (Object.keys(answersToSend).length === 0) {
      alert("No answers to submit");
      return;
    }
  
    axios
     .post(
        `${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/answers`,
        { userId: decoded.userId, answers: answersToSend, exam: Cookies.get("ExamId") },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("accessToken")}`,
          },
        }
      )
     .then((response) => {
        console.log("Answers submitted successfully:", response.data);
        Cookies.remove("ExamId");
  
        setAnsweredQuestions(new Set());
        setAnswers({});
        fetchQuestions();
      })
     .catch((error) => {
        console.error("There was a problem submitting answers:", error);
      });
  };

  const formatTime = (seconds) => {
    if (seconds < 0) {
      return "00:00:00";
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const isLastPage = indexOfLastQuestion >= questions.length;

  const handleAnswerCheckAndSubmit = () => {
    if (window.confirm("Are you sure you want to submit?")) {
      handleSubmit();
    }
  };

  const handleCircleClick = (index) => {
    console.log(`Circle clicked at position: ${index + 1}`);
    const questionPage = Math.floor(index / questionsPerPage) + 1;
    setTargetQuestionIndex(index);
    setCurrentPage(questionPage);
  };

  useEffect(() => {
    if (
      targetQuestionIndex !== null &&
      questionRefs.current[targetQuestionIndex]
    ) {
      questionRefs.current[targetQuestionIndex].scrollIntoView({
        behavior: "smooth",
      });
      setTargetQuestionIndex(null);
    }
  }, [targetQuestionIndex, currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-screen-lg mx-auto">
        <div className="sticky top-0 bg-white py-4 px-8 mb-8 rounded-lg shadow-lg z-10">
          <div className="flex justify-between items-center">
            <div className="text-gray-800 font-bold">
              Time Remaining:{" "}
              <span className="text-red-400">{formatTime(secondsLeft)}</span>
            </div>
            <div
              className="w-5/12 overflow-hidden"
              style={{ height: "36px", position: "relative" }}
            >
              <Swiper
                effect="fade"
                hashNavigation={true}
                spaceBetween={8}
                grabCursor={true}
                centeredSlides={true}
                allowTouchMove={true}
                allowSlideNext={true}
                noSwipingClass="swiper-no-swiping"
                slidesPerView={"auto"}
              >
                {questions.map((_, index) => (
                  <SwiperSlide
                    key={index + "dakdjad"}
                    style={{ flexShrink: 1 }}
                  >
                    <div
                      className={`w-6 h-6 flex items-center justify-center rounded-full border-2  ${
                        answeredQuestions.has(index + 1)
                          ? "border-green-500"
                          : "border-gray-400"
                      }`}
                      style={{ position: "relative" }}
                      onClick={() => handleCircleClick(index)}
                    >
                      {answeredQuestions.has(index + 1) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-green-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style={{
                            position: "absolute",
                            zIndex: 1,
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.707 15.707a1 1 0 0 0 1.414 0l6-6a1 1 0 0 0-1.414-1.414L9 13.586l-2.293-2.293a1 1 0 1 0-1.414 1.414l3 3z"
                          />
                        </svg>
                      )}
                      <span style={{ position: "relative", zIndex: 0 }}>
                        {answeredQuestions.has(index + 1) ? "" : index + 1}
                      </span>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          MCQ Quiz
        </h2>
        {questions.length < 1 ? (
          <div className="w-full h-full flex justify-center text-2xl font-bold text-pink-500">
            Exam has Not Started Yet
          </div>
        ) : (
          questions
            .slice(indexOfFirstQuestion, indexOfLastQuestion)
            .map((question, index) => (
              <div
                key={question._id}
                className="mb-8"
                ref={(el) =>
                  (questionRefs.current[indexOfFirstQuestion + index] = el)
                }
              >
                <div className="text-gray-800 text-lg mb-4 font-bold">
                  Q{index + 1 + (currentPage - 1) * questionsPerPage}:{" "}
                  {question.question}
                </div>
                <hr className="my-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="radio"
                        disabled={disabled}
                        name={question._id}
                        className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                        onChange={() =>
                          handleRadioChange(question._id, index, option)
                        }
                        checked={answers[question._id] === option}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))
        )}

        <hr className="my-6" />
        <div className="flex justify-between mt-8">
          <button
            className={`px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className={`px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isLastPage ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleNextPage}
            disabled={isLastPage}
          >
            Next
          </button>
        </div>

        <div className="flex justify-end mt-8">
          <button
            className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={handleAnswerCheckAndSubmit}
          >
            Submit
          </button>
        </div>
        <div className="flex flex-col align-middle items-center justify-center mt-8">
          <h1 className="text-xl py-3 uppercase font-bold">Logout</h1>
          <button
            className="px-6 py-3 rounded-lg bg-red-400 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCQPage;
