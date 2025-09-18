// Re-export the canonical leadService from src/services/api.js so the app
// uses a single implementation. This prevents duplicated logic and ensures
// updates/dispatch behavior is consistent across the codebase.
import { leadService as canonicalLeadService } from "./api";
export const leadService = canonicalLeadService;
