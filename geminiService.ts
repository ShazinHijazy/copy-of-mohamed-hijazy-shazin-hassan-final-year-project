import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SwarmState, DroneStatus } from "../types.ts";

export class GeminiService {
  private getSystemInstruction(state: SwarmState, hysteresisBuffer: number) {
    const activeDrones = state.drones.filter(d => d.status === DroneStatus.FLYING).length;
    const rtbDrones = state.drones.filter(d => d.status === DroneStatus.RTL).length;
    const failedDrones = state.drones.filter(d => d.status === DroneStatus.FAILED).length;
    const driftedDrones = state.drones.filter(d => d.sensors.imu.drift > 0.05).length;
    
    return `
      You are the Aegis Swarm Operations Copilot (ASOC). 
      ROLE: Real-time mission analyst and hardware diagnostic strategist.

      SITUATION SUMMARY:
      - Units: ${state.drones.length} total (${activeDrones} Active, ${rtbDrones} RTL, ${failedDrones} Failed)
      - Calibration Status: ${driftedDrones} units exhibiting non-trivial IMU drift.
      - Atmosphere: Rain Intensity ${(state.environment.rain * 100).toFixed(0)}%, Wind Speed ${state.environment.windSpeed.toFixed(1)} m/s.
      - Current Leader: ${state.leaderId || 'NONE'}

      TECHNICAL CONTEXT:
      - Emergency Protocol Active: Automatic RTL if RSSI < -90dBm.
      - Environmental Load: High wind increases battery drain and voltage sag. Rain dampens RF and increases GPS HDOP.
      - Leader Election Strategy: Threshold Consensus (Weight: Batt 60%, Sig 20%, Stability 20%).

      INSTRUCTIONS:
      1. Provide tactical advice focusing on environmental stress on hardware.
      2. If acting as a background SITREP, keep it to exactly one line of text for the logs.
      3. Use a military/defense tone (e.g., "CAUTION: Wind load increasing motor current on UAV-3; recommend reducing cruise velocity").
    `;
  }

  async *analyzeSwarmStream(state: SwarmState, userPrompt: string, hysteresisBuffer: number) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const streamResponse = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: userPrompt,
        config: {
          systemInstruction: this.getSystemInstruction(state, hysteresisBuffer),
          temperature: 0.7
        }
      });

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        if (c.text) yield c.text;
      }
    } catch (error: any) {
      console.error("Gemini Service Error:", error);
      yield `[COMM_ERROR]: ${error.message || 'Signal lost.'}`;
    }
  }

  async generateSitrep(state: SwarmState, hysteresisBuffer: number): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Perform a background SITREP scan. Focus on hardware stress from wind/rain and consensus integrity.",
        config: {
          systemInstruction: this.getSystemInstruction(state, hysteresisBuffer),
          temperature: 0.3
        }
      });
      return response.text?.trim() || "Hardware sweep complete. Swarm adapting to current environmental variables.";
    } catch (error) {
      return "Background sensor diagnostic service interrupted.";
    }
  }
}

export const geminiService = new GeminiService();