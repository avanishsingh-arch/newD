export interface Ticket {
  id: string | number;
  type: string;
  status: string;
  channel: string;
  client: string;
  agent: string;
  createdOn: Date | null;
  closedOn: Date | null;
  initialResponseTime: number;
  totalResponseTime: number;
  avgResponseTime: number;
  maxResponseTime: number;
  workingResolutionMin: number;
  totalResponseMin:      number;
}

export interface AgentStats {
  agent: string;
  total: number;
  resolved: number;
  sumRes: number;
  avgRes: number | null;
}

export interface ChannelStats {
  channel: string;
  shortName: string;
  tickets: number;
  total: number;
  avgResMin: number;
}

export interface DailyStats {
  date: string;
  tickets: number;
  resolved: number;
  total: number;
  avgRes: number;
}
export type MetricType = "initial" | "total";