export type TokenMap = {
  PROJECT_NAME: string;
  PROJECT_SLUG: string;
  OWNER: string;
  DATE: string;
  ITER_NUM: string;
  PLATFORM: string;
  PACK_NAME: string;
  PACK_VERSION: string;
};

export type SeedItemType = "feature" | "chore" | "bug" | "spike";

export type Priority = "P0" | "P1" | "P2";

export type Complexity = "XS" | "S" | "M" | "L" | "XL";

export interface SeedItem {
  id?: string;
  type: SeedItemType;
  title: string;
  priority?: Priority;
  complexity?: Complexity;
  dependencies?: string[];
  promoted?: boolean;
  file?: string;
  objective?: string;
  acceptance?:
    | string[]
    | { given?: string; when?: string; then?: string }[];
  subtasks?: string[];
}

export interface ProjectSpec {
  meta: {
    projectName: string;
    projectSlug: string;
    owner: string;
    platform: "web" | "mobile";
    packName: string;
    packVersion: string;
    templateVersion: string;
    dir: string;
  };
  framing: {
    goal: string;
    outcomes: string[];
    constraints?: string[];
    nonGoals?: string[];
  };
  iteration: {
    iterNum: "01";
    goal: string;
    outcomes: string[];
    seedItems: SeedItem[];
  };
}

