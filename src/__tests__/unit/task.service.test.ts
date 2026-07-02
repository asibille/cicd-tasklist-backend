import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
	task: {
		findMany: vi.fn(),
		findUnique: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock("../../lib/prisma.js", () => ({
	default: mockPrisma,
}));

import * as taskService from "../../services/task.service.js";
const mockTask = {
  id: 1,
  title: 'Test Task',
  description: 'Test description',
  completed: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TaskService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTask]);
      const result = await taskService.findAll();
      expect(mockPrisma.task.findMany).toHaveBeenCalledOnce();
      expect(result).toEqual([mockTask]);
    });

    it('should return empty array when no tasks', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      const result = await taskService.findAll();
      expect(result).toEqual([]);
    });

    it('should throw when prisma throws', async () => {
      mockPrisma.task.findMany.mockRejectedValue(new Error('DB error'));
      await expect(taskService.findAll()).rejects.toThrow('DB error');
    });
  });

  describe('findById', () => {
    it('should return a task by id', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      const result = await taskService.findById(1);
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockTask);
    });

    it('should return null when task not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);
      const result = await taskService.findById(999);
      expect(result).toBeNull();
    });

    it('should throw when prisma throws', async () => {
      mockPrisma.task.findUnique.mockRejectedValue(new Error('DB error'));
      await expect(taskService.findById(1)).rejects.toThrow('DB error');
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const newTask = { title: 'New Task', description: 'New Desc' };
      mockPrisma.task.create.mockResolvedValue({ ...mockTask, ...newTask });
      const result = await taskService.create(newTask);
      expect(result.title).toBe('New Task');
    });

    it('should create task without description', async () => {
      mockPrisma.task.create.mockResolvedValue(mockTask);
      const result = await taskService.create({ title: 'Task' });
      expect(result).toBeDefined();
    });

    it('should throw when prisma throws', async () => {
      mockPrisma.task.create.mockRejectedValue(new Error('DB error'));
      await expect(taskService.create({ title: 'Task' })).rejects.toThrow('DB error');
    });
  });

  describe('update', () => {
    it('should update an existing task', async () => {
      const updateData = { title: 'Updated Task', completed: true };
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.task.update.mockResolvedValue({ ...mockTask, ...updateData });
      const result = await taskService.update(1, updateData);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({ where: { id: 1 }, data: updateData });
      expect(result.title).toBe('Updated Task');
    });

    it('should throw Task not found when task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);
      await expect(taskService.update(999, { title: 'Updated' })).rejects.toThrow('Task not found');
    });

    it('should throw when prisma update throws', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.task.update.mockRejectedValue(new Error('DB error'));
      await expect(taskService.update(1, { title: 'Task' })).rejects.toThrow('DB error');
    });
  });

  describe('remove', () => {
    it('should delete an existing task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.task.delete.mockResolvedValue(mockTask);
      const result = await taskService.remove(1);
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBeDefined();
    });

    it('should throw Task not found when task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);
      await expect(taskService.remove(999)).rejects.toThrow('Task not found');
    });

    it('should throw when prisma delete throws', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.task.delete.mockRejectedValue(new Error('DB error'));
      await expect(taskService.remove(1)).rejects.toThrow('DB error');
    });
  });
});