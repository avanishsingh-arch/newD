import type { Ticket } from "./types";
import { workingMinutesBetween } from "./workingHours";

const CHANNELS = [
  "WhatsApp Business API Gupshup",
  "Email",
  "Live Chat",
  "Phone",
  "Instagram",
  "Facebook",
];

const AGENTS = [
  "Shruti Phapale",
  "Anika Sharma",
  "Rahul Verma",
  "Priya Iyer",
  "Deepak Nair",
  "Meera Joshi",
];

const STATUSES = [
  "Conversation closed",
  "Conversation closed",
  "Conversation closed",
  "Open",
  "Pending",
];

const TYPES   = ["Inbound", "Outbound"];
const CLIENTS = ["Richa","Arjun","Sneha","Vikram","Pooja","Mohit","Divya","Sanjay","Kiran","Neha"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate `count` realistic demo tickets spread over the last 30 days. */
export function generateDemoData(count = 200): Ticket[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const createdOn = new Date(now - Math.random() * 30 * 86_400_000);
    // Resolution between 10 min and 8 working hours
    const resMin    = Math.floor(Math.random() * 480) + 10;
    const closedOn  = new Date(createdOn.getTime() + resMin * 60_000);
    const status    = pick(STATUSES);

    return {
      id:                    74000 + i,
      type:                  pick(TYPES),
      status,
      channel:               pick(CHANNELS),
      client:                pick(CLIENTS),
      agent:                 pick(AGENTS),
      createdOn,
      closedOn:              status.includes("closed") ? closedOn : null,
      initialResponseTime:   Math.floor(Math.random() * 60) + 1,
      totalResponseTime:     resMin,
      avgResponseTime:       Math.floor(resMin * 0.6),
      maxResponseTime:       Math.floor(resMin * 1.2),
      workingResolutionMin:  workingMinutesBetween(
        createdOn,
        status.includes("closed") ? closedOn : null
      ),
    } satisfies Ticket;
  });
}
