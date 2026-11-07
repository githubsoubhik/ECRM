"use client";

import { useEffect, useState } from "react";

interface Project {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/todos"
        ); 

        const data = await response.json();

        // Save data into state
        setProjects(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchProjects();
  }, []);

  const deleteProject = (id: number) => {
    setProjects(projects.filter((project) => project.id !== id));
  };

  return (
    <div className="project-container">
      <div className="project-header">
        <div>
          <h1>Projects</h1>
          <p>Manage and track all your projects.</p>
        </div>

        <button className="add-project-btn">
          + Add Project
        </button>
      </div>

      <div className="project-table-wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>User ID</th>
              <th>Email</th>
              <th>Deadline</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.title}</td>

                <td>{project.userId}</td>

                <td>-</td>

                <td>-</td>

                <td>-</td>

                <td>
                  <span
                    className={`project-status ${
                      project.completed ? "completed" : "pending"
                    }`}
                  >
                    {project.completed ? "Completed" : "Pending"}
                  </span>
                </td>

                <td>
                  <button className="project-edit-btn">
                    Edit
                  </button>

                  <button
                    className="project-delete-btn"
                    onClick={() => deleteProject(project.id)}
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
  );
}