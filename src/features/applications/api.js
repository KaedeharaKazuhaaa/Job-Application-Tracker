export const applicationStatuses = ["Applied", "Interview", "Offer", "Declined"];

export const statusLabels = {
  Applied: "Applied",
  Interview: "Interviewing",
  Offer: "Offer",
  Declined: "Declined",
};

export function emptyApplication(status = "Applied") {
  return {
    company: "",
    role: "",
    location: "",
    status,
    appliedAt: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }
  return result;
}

export function formatDate(date) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
