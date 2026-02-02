import { Router, Request, Response } from 'express';
import projectController from '../controllers/projectController';
import { validateProjectId } from '../middlewares/validation';

const router = Router();

// Get all projects for a user
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default-user';
    const projects = projectController.getAllProjects(userId);
    
    res.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
    });
  }
});

// Get a specific project by ID
router.get('/:id', validateProjectId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = projectController.getProjectById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
    });
  }
});

// Create a new project
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, userId, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Name and URL are required',
      });
    }

    const project = projectController.createProject(
      name,
      description || '',
      userId || 'default-user',
      url
    );

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
    });
  }
});

// Update a project
router.put('/:id', validateProjectId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = projectController.updateProject(id, updates);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
    });
  }
});

// Delete a project
router.delete('/:id', validateProjectId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = projectController.deleteProject(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
    });
  }
});

// Deploy a project
router.post('/:id/deploy', validateProjectId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = projectController.deployProject(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      message: 'Deployment started',
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to deploy project',
    });
  }
});

export default router;
