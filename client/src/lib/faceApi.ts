/**
 * Face API utility for face recognition using face-api.js
 * Extracts 128-dimensional face embeddings for registration and verification
 */

import * as faceapi from 'face-api.js';

// Model loading state
let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

// Model path - models should be in /public/models
const MODEL_URL = '/models';

/**
 * Load face-api.js models
 * Models needed: tinyFaceDetector, faceLandmark68Net, faceRecognitionNet
 */
export async function loadFaceApiModels(): Promise<void> {
    if (modelsLoaded) return;

    if (modelsLoading) {
        await modelsLoading;
        return;
    }

    modelsLoading = (async () => {
        try {
            console.log('[FaceAPI] Loading models...');
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            modelsLoaded = true;
            console.log('[FaceAPI] Models loaded successfully');
        } catch (error) {
            console.error('[FaceAPI] Failed to load models:', error);
            throw new Error('Failed to load face recognition models');
        }
    })();

    await modelsLoading;
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
    return modelsLoaded;
}

/**
 * Extract face embedding (128-D descriptor) from a video element
 */
export async function extractFaceEmbedding(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
    if (!modelsLoaded) {
        await loadFaceApiModels();
    }

    try {
        // Detect face with landmarks and descriptor
        const detection = await faceapi
            .detectSingleFace(videoOrCanvas, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            console.warn('[FaceAPI] No face detected');
            return null;
        }

        // Return the 128-D face descriptor
        return detection.descriptor;
    } catch (error) {
        console.error('[FaceAPI] Error extracting embedding:', error);
        return null;
    }
}

/**
 * Calculate Euclidean distance between two embeddings
 */
export function calculateDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same length');
    }

    return Math.sqrt(
        embedding1.reduce((sum, val, i) => sum + Math.pow(val - embedding2[i], 2), 0)
    );
}

/**
 * Verify if two embeddings belong to the same person
 * Threshold: < 0.6 means same person
 */
export function verifyFaceMatch(
    embedding1: number[],
    embedding2: number[],
    threshold: number = 0.6
): boolean {
    const distance = calculateDistance(embedding1, embedding2);
    console.log(`[FaceAPI] Distance: ${distance.toFixed(4)}, Threshold: ${threshold}`);
    return distance < threshold;
}

/**
 * Convert Float32Array to regular number array for JSON serialization
 */
export function embeddingToArray(embedding: Float32Array): number[] {
    return Array.from(embedding);
}

/**
 * Detect if a face is present in the video/canvas
 */
export async function detectFace(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement
): Promise<boolean> {
    if (!modelsLoaded) {
        await loadFaceApiModels();
    }

    try {
        const detection = await faceapi.detectSingleFace(
            videoOrCanvas,
            new faceapi.TinyFaceDetectorOptions()
        );
        return !!detection;
    } catch (error) {
        console.error('[FaceAPI] Error detecting face:', error);
        return false;
    }
}

/**
 * Get face detection with bounding box for UI overlay
 */
export async function getFaceDetectionBox(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement
): Promise<{ x: number; y: number; width: number; height: number } | null> {
    if (!modelsLoaded) {
        await loadFaceApiModels();
    }

    try {
        const detection = await faceapi.detectSingleFace(
            videoOrCanvas,
            new faceapi.TinyFaceDetectorOptions()
        );

        if (!detection) return null;

        return {
            x: detection.box.x,
            y: detection.box.y,
            width: detection.box.width,
            height: detection.box.height,
        };
    } catch (error) {
        console.error('[FaceAPI] Error getting detection box:', error);
        return null;
    }
}
