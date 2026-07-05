// Hand-picked external resources per DVSA skill. Surfaces below skill rows
// rated under 50% (i.e. averageRating < 2.5) so students get a one-tap path
// to revision content. All links open in the device's default browser.
//
// Using gov.uk + DVSA's own YouTube channel keeps the source authoritative
// and avoids us having to host content. Keep the list short — one strong
// link per skill beats three mediocre ones.

export type SkillResource = {
  title: string;
  url: string;
  durationLabel?: string;
};

const RESOURCES: Record<string, SkillResource> = {
  cockpitChecks: {
    title: "Cockpit drill checklist",
    url: "https://www.safedrivingforlife.info/free-resources/practical-test/cockpit-drill/",
    durationLabel: "3 min read",
  },
  movingOff: {
    title: "Moving off and stopping safely",
    url: "https://www.youtube.com/results?search_query=moving+off+driving+lesson+uk",
    durationLabel: "5 min video",
  },
  mirrors: {
    title: "Mirrors, signal, manoeuvre",
    url: "https://www.gov.uk/guidance/the-highway-code/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158",
    durationLabel: "Highway Code",
  },
  useOfSpeed: {
    title: "Speed limits and stopping distances",
    url: "https://www.gov.uk/speed-limits",
    durationLabel: "Gov.uk",
  },
  junctions: {
    title: "Junctions explained",
    url: "https://www.youtube.com/results?search_query=junctions+driving+lesson+uk+dvsa",
    durationLabel: "5 min video",
  },
  roundabouts: {
    title: "Roundabouts step by step",
    url: "https://www.youtube.com/results?search_query=roundabouts+driving+test+uk",
    durationLabel: "6 min video",
  },
  pedestrianCrossings: {
    title: "Pedestrian crossings",
    url: "https://www.gov.uk/guidance/the-highway-code/rules-for-pedestrians-1-to-35",
    durationLabel: "Highway Code",
  },
  positioning: {
    title: "Lane discipline and positioning",
    url: "https://www.youtube.com/results?search_query=lane+discipline+driving+uk",
    durationLabel: "4 min video",
  },
  awareness: {
    title: "Hazard perception practice",
    url: "https://www.gov.uk/theory-test/revision-and-practice",
    durationLabel: "Practice tests",
  },
  dualCarriageways: {
    title: "Dual carriageways and slip roads",
    url: "https://www.youtube.com/results?search_query=dual+carriageway+driving+lesson+uk",
    durationLabel: "5 min video",
  },
  independentDriving: {
    title: "Independent driving with sat nav",
    url: "https://www.youtube.com/results?search_query=independent+driving+test+uk",
    durationLabel: "4 min video",
  },
  parallelParking: {
    title: "Parallel parking step by step",
    url: "https://www.youtube.com/results?search_query=parallel+parking+driving+test+uk",
    durationLabel: "5 min video",
  },
  forwardParking: {
    title: "Forward bay parking",
    url: "https://www.youtube.com/results?search_query=forward+bay+parking+driving+test+uk",
    durationLabel: "4 min video",
  },
  reverseParking: {
    title: "Reverse bay parking",
    url: "https://www.youtube.com/results?search_query=reverse+bay+parking+driving+test+uk",
    durationLabel: "5 min video",
  },
};

export function getSkillResource(skillKey: string): SkillResource | null {
  return RESOURCES[skillKey] || null;
}
