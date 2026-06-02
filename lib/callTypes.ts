export interface CallRow {
  slNo:            string;
  dateTime:        Date | null;
  source:          string;
  sourceName:      string;
  destination:     string;
  destinationName: string;
  direction:       "Incoming" | "Outgoing" | "Unknown";
  did:             string;
  callType:        string;
  department:      string;
  campaign:        string;
  status:          "ANSWERED" | "NOANSWER" | "OTHER";
  callDuration:    number;
  totalDuration:   number;
  rating:          string;
  comment:         string;
  tag:             string;
  disconnectedBy:  string;
  agentName:       string; // derived
}

export interface AgentCallStats {
  agent:        string;
  incoming:     number;
  outgoing:     number;
  answered:     number;
  notAnswered:  number;
  total:        number;
}