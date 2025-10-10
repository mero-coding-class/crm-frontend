import { useEffect, useState } from "react";

export default function useUsers(authToken) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await fetch(
          "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/users/",
          {
            headers: { Authorization: `Token ${authToken}` },
            credentials: "include",
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        const normalized = (list || []).map((u) => ({
          id: u?.id ?? null,
          username: u?.username ?? (u?.email ? u.email.split("@")[0] : null),
          name: u?.name ?? u?.username ?? u?.email ?? String(u?.id ?? ""),
          email: u?.email ?? "",
          raw: u,
        }));
        if (!cancelled) setUsers(normalized);
      } catch (err) {
        console.error("Error fetching users", err);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  return { users, usersLoading };
}
