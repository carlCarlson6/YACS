import { Request, Response, NextFunction } from 'express';

export const validateProjectId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }
  
  next();
};
