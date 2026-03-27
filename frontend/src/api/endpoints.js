// Hybrid API — mock auth (easy login) + REAL backend+ML for session/interview/results
import mockClient from "./mockClient";
import realClient from "./client";

// Auth uses mock (any email/password works for demo)
// Session uses REAL backend → REAL ML service for actual AI analysis
export const authApi = {
  register: (data) => mockClient.post("/auth/register", data),
  login:    (data) => mockClient.post("/auth/login", data),
  googleAuth: (firebaseToken, fullName, photoUrl) =>
    mockClient.post("/auth/google", { firebase_token: firebaseToken, full_name: fullName, photo_url: photoUrl }),
  getMe:    ()     => mockClient.get("/auth/me"),
  updateMe: (data) => mockClient.patch("/auth/me", data),
};

export const sessionApi = {
  startSession:      ()       => realClient.post("/session/start", {}),
  submitAnswer:      (data)   => realClient.post("/session/answer", data),
  getResult:         (id)     => realClient.get(`/session/result/${id}`),
  getHistory:        ()       => mockClient.get("/session/history"),
  populationReport:  (data)   => mockClient.post("/session/population/report", data),
  populationSummary: ()       => mockClient.get("/session/population/summary"),
};
