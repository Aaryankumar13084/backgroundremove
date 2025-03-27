import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import util from "util";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { settingsSchema, downloadOptionsSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: path.join(process.cwd(), "temp_uploads"),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, JPG, and PNG are allowed."));
    }
  },
});

// Helper to execute the Python backgroundremover command
const execFileAsync = util.promisify(execFile);

// Ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
    console.log(`Directory already exists: ${dirPath}`);
  } catch (error) {
    console.log(`Creating directory: ${dirPath}`);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`Successfully created directory: ${dirPath}`);
    } catch (mkdirError) {
      console.error(`Failed to create directory ${dirPath}:`, mkdirError);
      throw mkdirError;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure necessary directories exist
  const uploadsDir = path.join(process.cwd(), "temp_uploads");
  const processedDir = path.join(process.cwd(), "processed_images");
  await ensureDir(uploadsDir);
  await ensureDir(processedDir);

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'sitemap.xml'));
});

app.get('/generated-icon.png', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'generated-icon.png'));
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'robots.txt'));
});

  // API routes
  app.get("/api/settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getDefaultSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = settingsSchema.parse(req.body);
      const updatedSettings = await storage.updateSettings(settings);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  app.post("/api/upload", upload.single("image"), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const settings = await storage.getDefaultSettings();
      const inputPath = req.file.path;
      const outputFilename = `${Date.now()}_${path.parse(req.file.originalname).name}.png`;
      const outputPath = path.join(processedDir, outputFilename);

      // TODO: Implement actual background removal when Python package is available
      console.log("Background removal would process with these settings:", settings);
      
      // For now, just copy the file to simulate processing
      // This lets the UI flow continue to work without the Python dependency
      await fs.copyFile(inputPath, outputPath);

      // Return the path to the "processed" image 
      // (which is currently just a copy of the original)
      res.json({
        original: `/api/images/${req.file.filename}`,
        processed: `/api/images/processed/${outputFilename}`,
      });

    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  // Endpoint to serve original uploaded images
  app.get("/api/images/:filename", async (req: Request, res: Response) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    try {
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ message: "Image not found" });
    }
  });

  // Endpoint to serve processed images
  app.get("/api/images/processed/:filename", async (req: Request, res: Response) => {
    const filePath = path.join(processedDir, req.params.filename);
    try {
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ message: "Processed image not found" });
    }
  });

  // Download processed image with options
  app.post("/api/download", async (req: Request, res: Response) => {
    try {
      const { filepath, options } = req.body;
      const downloadOptions = downloadOptionsSchema.parse(options);
      
      if (!filepath) {
        return res.status(400).json({ message: "No file path provided" });
      }

      // Extract the filename from the path
      const filename = path.basename(filepath);
      const filePath = path.join(processedDir, filename);
      
      try {
        await fs.access(filePath);
        
        // Set content type based on format
        const contentType = downloadOptions.format === "png" ? "image/png" : "image/jpeg";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="background_removed.${downloadOptions.format}"`);
        
        // Send the file
        res.sendFile(filePath);
      } catch (error) {
        res.status(404).json({ message: "Processed image not found" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to download image" });
      }
    }
  });

  // Clean up uploaded and processed files periodically (every hour)
  setInterval(async () => {
    try {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Clean up temp uploads
      const uploadedFiles = await fs.readdir(uploadsDir);
      for (const file of uploadedFiles) {
        const filePath = path.join(uploadsDir, file);
        const stats = await fs.stat(filePath);
        if (stats.ctimeMs < oneHourAgo) {
          await fs.unlink(filePath);
        }
      }

      // Clean up processed images
      const processedFiles = await fs.readdir(processedDir);
      for (const file of processedFiles) {
        const filePath = path.join(processedDir, file);
        const stats = await fs.stat(filePath);
        if (stats.ctimeMs < oneHourAgo) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error("Error cleaning up files:", error);
    }
  }, 60 * 60 * 1000); // Run every hour

  const httpServer = createServer(app);
  return httpServer;
}
