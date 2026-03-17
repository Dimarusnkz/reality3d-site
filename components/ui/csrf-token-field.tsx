"use client";

import { useEffect, useState } from "react";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function CsrfTokenField() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(getCookie("csrf_token"));
  }, []);

  return <input type="hidden" name="csrf_token" value={token} />;
}

