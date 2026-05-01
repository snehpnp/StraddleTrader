import { Request, Response } from 'express';
import Strategy from '../models/Strategy';

interface AuthReq extends Request { userId?: string; }

export const getStrategies = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const strategies = await Strategy.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, strategies });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getStrategy = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const strategy = await Strategy.findOne({ _id: req.params.id, userId: req.userId });
    if (!strategy) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, strategy });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createStrategy = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { name, strategyType, config } = req.body;
    if (!name || !config) { res.status(400).json({ success: false, message: 'name and config required' }); return; }
    const strategy = await Strategy.create({ userId: req.userId, name, strategyType: strategyType || 'straddle', config, status: 'draft' });
    res.status(201).json({ success: true, strategy });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateStrategy = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const strategy = await Strategy.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, status: { $in: ['draft', 'stopped'] } },
      { $set: req.body },
      { new: true }
    );
    if (!strategy) { res.status(404).json({ success: false, message: 'Not found or cannot edit active strategy' }); return; }
    res.json({ success: true, strategy });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteStrategy = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    await Strategy.findOneAndDelete({ _id: req.params.id, userId: req.userId, status: { $in: ['draft', 'stopped', 'completed'] } });
    res.json({ success: true, message: 'Deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const activateStrategy = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const strategy = await Strategy.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, status: { $in: ['draft', 'stopped'] } },
      { status: 'active', isActive: true },
      { new: true }
    );
    if (!strategy) { res.status(404).json({ success: false, message: 'Cannot activate' }); return; }
    res.json({ success: true, strategy, message: 'Strategy activated' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deactivateStrategy = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const strategy = await Strategy.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, status: 'active' },
      { status: 'stopped', isActive: false },
      { new: true }
    );
    if (!strategy) { res.status(404).json({ success: false, message: 'Not found or not active' }); return; }
    res.json({ success: true, strategy, message: 'Strategy stopped' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const exitStrategy = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const strategy = await Strategy.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'completed', isActive: false, exitTime: new Date() },
      { new: true }
    );
    if (!strategy) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, strategy, message: 'Strategy exited' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
