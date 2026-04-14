const BASE = "";

export const api = {
  dashboard: async (view) => {
    const res = await fetch(`${BASE}/api/analysis/dashboard?view=${view}`);
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    return res.json();
  },

  status: async () => {
    const res = await fetch(`${BASE}/api/data/status`);
    if (!res.ok) throw new Error("Failed to fetch status");
    return res.json();
  },
};

export default api;
