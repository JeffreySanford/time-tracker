export interface ProjectTag {
  name: string;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  bgColor?: string;
  description?: string;
  suggestedTags?: ProjectTag[];
  // New optional fields for richer project data
  category?: string;      // e.g. product, client, community
  owner?: string;         // owner or client name
  progress?: number;      // 0-100 percent
  subprojects?: Project[];
  features?: string[];
  notes?: string[];
  isCodeProject?: boolean; // controls whether to show Git analytics in reports
  isBillable?: boolean; // new flag: include time in billing metrics
}
