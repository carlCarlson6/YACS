// Mock database for projects
interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  url: string;
  status: 'active' | 'inactive' | 'deploying';
  createdAt: Date;
  updatedAt: Date;
}

class ProjectController {
  private projects: Map<string, Project> = new Map();
  private projectIdCounter: number = 1;

  getAllProjects(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.get(id);
  }

  createProject(name: string, description: string, userId: string, url: string): Project {
    const id = `proj_${this.projectIdCounter++}`;
    const project: Project = {
      id,
      name,
      description,
      userId,
      url,
      status: 'inactive',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.set(id, project);
    return project;
  }

  updateProject(id: string, data: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) {
      return undefined;
    }

    const updated = { ...project, ...data, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  deployProject(id: string): Project | undefined {
    const project = this.projects.get(id);
    if (!project) {
      return undefined;
    }

    const updated = { ...project, status: 'deploying' as const, updatedAt: new Date() };
    this.projects.set(id, updated);

    // Simulate deployment completion after 2 seconds
    setTimeout(() => {
      const finalProject = { ...updated, status: 'active' as const, updatedAt: new Date() };
      this.projects.set(id, finalProject);
    }, 2000);

    return updated;
  }
}

export default new ProjectController();
