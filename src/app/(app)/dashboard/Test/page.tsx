"use client";

import { useEffect } from "react";
import { fetchWithAuth } from "../../../../../lib/fetchWithAuth";

// The component name must be capitalized (Test)
const TestPage = () => {
  const fetchEmployee = async () => {
    try {
    //   const empResp = await fetchWithAuth('/api/getAllEmployee');
       const empResp = await fetchWithAuth('/api/getAllEmployee');
      
      if (!empResp.ok) {
        throw new Error(`HTTP error! Status: ${empResp.status}`);
      }

      const data = await empResp.json();
      console.log("data--->", data);
    } catch (error) {
      console.log("error.........", error);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  return (
    <>
      <h1>Test Route</h1>
    </>
  );
};

export default TestPage;