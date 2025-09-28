export interface Node {
  data: Record<string, string>;
  children?: Record<string, { records: Node[] }>;
  __path?: string[];
}
