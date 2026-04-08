const DEMO_MODE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_DEMO_MODE === "1")
  || (typeof process !== "undefined" && process.env?.REACT_APP_DEMO_MODE === "1");

function pad2(value) {
  return String(value).padStart(2, "0");
}

function dateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function timestampAt(offsetDays, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function progress(values) {
  return {
    cockpitChecks: values[0],
    movingOff: values[1],
    junctions: values[2],
    roundabouts: values[3],
    mirrors: values[4],
    parking: values[5],
    maneuvers: values[6],
    independentDriving: values[7]
  };
}

const demoIds = {
  instructor: "demo-instructor",
  student: "demo-student",
  studentUser: "demo-student-user"
};

const demoUsers = [
  {
    id: "user-instructor",
    uid: demoIds.instructor,
    email: "instructor@app7i.demo",
    role: "instructor",
    subscriptionStatus: "active",
    createdAt: Date.now() - 86400000 * 30
  },
  {
    id: "user-student",
    uid: demoIds.studentUser,
    email: "student@app7i.demo",
    role: "student",
    subscriptionStatus: "active",
    createdAt: Date.now() - 86400000 * 7
  }
];

const demoStudents = [
  {
    id: demoIds.student,
    instructorId: demoIds.instructor,
    name: "Jamie Park",
    email: "student@app7i.demo",
    phone: "07700 900123",
    transmission: "manual",
    theoryPassed: true,
    theoryTestDate: dateString(-14),
    practicalTestDate: dateString(7),
    mockTestScore: 78,
    lessonBalance: 2,
    confidenceLevel: 4,
    riskLevel: "steady",
    nextFocus: "Roundabouts and busy junctions",
    perfectDriver: false,
    parkingPractice: true,
    progress: progress([4, 4, 3, 3, 4, 2, 3, 3]),
    testPassed: false,
    testPassedDate: ""
  },
  {
    id: "demo-student-2",
    instructorId: demoIds.instructor,
    name: "Taylor Reed",
    email: "taylor@app7i.demo",
    phone: "07700 900456",
    transmission: "auto",
    theoryPassed: true,
    theoryTestDate: dateString(-30),
    practicalTestDate: dateString(2),
    mockTestScore: 84,
    lessonBalance: 1,
    confidenceLevel: 5,
    riskLevel: "steady",
    nextFocus: "Independent driving",
    perfectDriver: true,
    parkingPractice: false,
    progress: progress([5, 5, 4, 4, 5, 4, 4, 5]),
    testPassed: true,
    testPassedDate: dateString(0)
  },
  {
    id: "demo-student-3",
    instructorId: demoIds.instructor,
    name: "Morgan Ellis",
    email: "morgan@app7i.demo",
    phone: "07700 900789",
    transmission: "manual",
    theoryPassed: false,
    theoryTestDate: "",
    practicalTestDate: "",
    mockTestScore: 62,
    lessonBalance: 4,
    confidenceLevel: 3,
    riskLevel: "watch",
    nextFocus: "Mirrors and clutch control",
    perfectDriver: false,
    parkingPractice: true,
    progress: progress([2, 2, 2, 1, 2, 1, 2, 1]),
    testPassed: false,
    testPassedDate: ""
  },
  {
    id: "demo-student-4",
    instructorId: demoIds.instructor,
    name: "Riley Chen",
    email: "riley@app7i.demo",
    phone: "07700 900654",
    transmission: "auto",
    theoryPassed: true,
    theoryTestDate: dateString(-10),
    practicalTestDate: dateString(14),
    mockTestScore: 71,
    lessonBalance: 3,
    confidenceLevel: 4,
    riskLevel: "steady",
    nextFocus: "Parking and mirrors",
    perfectDriver: false,
    parkingPractice: true,
    progress: progress([3, 3, 3, 3, 3, 2, 3, 2]),
    testPassed: false,
    testPassedDate: ""
  },
  {
    id: "demo-student-5",
    instructorId: demoIds.instructor,
    name: "Alex Rivera",
    email: "alex@app7i.demo",
    phone: "07700 900321",
    transmission: "manual",
    theoryPassed: false,
    theoryTestDate: "",
    practicalTestDate: "",
    mockTestScore: 55,
    lessonBalance: 5,
    confidenceLevel: 2,
    riskLevel: "watch",
    nextFocus: "Moving off and junctions",
    perfectDriver: false,
    parkingPractice: false,
    progress: progress([1, 2, 1, 1, 2, 1, 1, 1]),
    testPassed: false,
    testPassedDate: ""
  }
];

const demoLessons = [
  {
    id: "demo-lesson-1",
    instructorId: demoIds.instructor,
    studentId: demoIds.student,
    studentName: "Jamie Park",
    studentEmail: "student@app7i.demo",
    studentPhone: "07700 900123",
    date: dateString(0),
    time: "09:00",
    duration: 1,
    instructor: "Alex Morgan",
    notes: "Warm-up route and roundabout focus",
    timestamp: timestampAt(0, 9),
    review: {
      status: "scheduled",
      coachScore: 3,
      skillsCovered: [],
      strengths: "",
      focusNext: "",
      homework: "",
      privateNotes: "",
      followUpNeeded: false,
      paymentStatus: "paid"
    }
  },
  {
    id: "demo-lesson-2",
    instructorId: demoIds.instructor,
    studentId: demoIds.student,
    studentName: "Jamie Park",
    studentEmail: "student@app7i.demo",
    studentPhone: "07700 900123",
    date: dateString(1),
    time: "11:30",
    duration: 1.5,
    instructor: "Alex Morgan",
    notes: "Dual carriageway entry practice",
    timestamp: timestampAt(1, 11, 30),
    review: {
      status: "scheduled",
      coachScore: 3,
      skillsCovered: [],
      strengths: "",
      focusNext: "",
      homework: "",
      privateNotes: "",
      followUpNeeded: false,
      paymentStatus: "pending"
    }
  },
  {
    id: "demo-lesson-3",
    instructorId: demoIds.instructor,
    studentId: "demo-student-2",
    studentName: "Taylor Reed",
    studentEmail: "taylor@app7i.demo",
    studentPhone: "07700 900456",
    date: dateString(-2),
    time: "14:00",
    duration: 1,
    instructor: "Alex Morgan",
    notes: "Mock test route",
    timestamp: timestampAt(-2, 14),
    review: {
      status: "completed",
      coachScore: 5,
      skillsCovered: ["roundabouts", "independentDriving", "parking"],
      strengths: "Great mirror checks and calm speed control.",
      focusNext: "Tighten up bay parking positioning.",
      homework: "Practise reverse bay parking once this week.",
      privateNotes: "Ready for test booking.",
      followUpNeeded: false,
      paymentStatus: "card"
    }
  },
  {
    id: "demo-lesson-4",
    instructorId: demoIds.instructor,
    studentId: "demo-student-3",
    studentName: "Morgan Ellis",
    studentEmail: "morgan@app7i.demo",
    studentPhone: "07700 900789",
    date: dateString(-1),
    time: "16:00",
    duration: 1,
    instructor: "Alex Morgan",
    notes: "Basic control and junction awareness",
    timestamp: timestampAt(-1, 16),
    review: {
      status: "completed",
      coachScore: 2,
      skillsCovered: ["movingOff", "junctions"],
      strengths: "Improved clutch control.",
      focusNext: "Mirror checks before signaling.",
      homework: "Mirror-signal routine on each turn.",
      privateNotes: "Needs confidence boost.",
      followUpNeeded: true,
      paymentStatus: "pending"
    }
  },
  {
    id: "demo-lesson-5",
    instructorId: demoIds.instructor,
    studentId: "demo-student-4",
    studentName: "Riley Chen",
    studentEmail: "riley@app7i.demo",
    studentPhone: "07700 900654",
    date: dateString(3),
    time: "10:00",
    duration: 2,
    instructor: "Alex Morgan",
    notes: "Parking and city center awareness",
    timestamp: timestampAt(3, 10),
    review: {
      status: "scheduled",
      coachScore: 3,
      skillsCovered: [],
      strengths: "",
      focusNext: "",
      homework: "",
      privateNotes: "",
      followUpNeeded: false,
      paymentStatus: "bank"
    }
  },
  {
    id: "demo-lesson-6",
    instructorId: demoIds.instructor,
    studentId: "demo-student-5",
    studentName: "Alex Rivera",
    studentEmail: "alex@app7i.demo",
    studentPhone: "07700 900321",
    date: dateString(-6),
    time: "08:30",
    duration: 1,
    instructor: "Alex Morgan",
    notes: "Basic road positioning",
    timestamp: timestampAt(-6, 8, 30),
    review: {
      status: "completed",
      coachScore: 3,
      skillsCovered: ["cockpitChecks", "movingOff"],
      strengths: "Good awareness of pedals.",
      focusNext: "Smooth braking and mirror checks.",
      homework: "Mirror checks before braking.",
      privateNotes: "",
      followUpNeeded: false,
      paymentStatus: "cash"
    }
  }
];

const demoMessages = [
  {
    id: "demo-msg-1",
    instructorId: demoIds.instructor,
    sender: demoIds.instructor,
    receiver: demoIds.student,
    text: "Hi Jamie, see you at 9am tomorrow. Please confirm.",
    timestamp: timestampAt(-1, 17, 15),
    read: true
  },
  {
    id: "demo-msg-2",
    instructorId: demoIds.instructor,
    sender: demoIds.student,
    receiver: demoIds.instructor,
    text: "Confirmed, thank you.",
    timestamp: timestampAt(-1, 17, 25),
    read: false
  },
  {
    id: "demo-msg-3",
    instructorId: demoIds.instructor,
    sender: demoIds.instructor,
    receiver: "demo-student-2",
    text: "Great drive today. Book your test slot when ready.",
    timestamp: timestampAt(-2, 18, 5),
    read: true
  }
];

const demoTips = [
  {
    id: "demo-tip-1",
    instructorId: demoIds.instructor,
    title: "Mirror routine",
    content: "Check mirrors every 5 to 8 seconds and before any speed change.",
    type: "text",
    videoUrl: null,
    timestamp: Date.now() - 86400000 * 2
  },
  {
    id: "demo-tip-2",
    instructorId: demoIds.instructor,
    title: "Roundabout positioning",
    content: "Plan early, pick lane markers, and keep speed steady.",
    type: "text",
    videoUrl: null,
    timestamp: Date.now() - 86400000 * 5
  }
];

const demoNotifications = [
  {
    id: "demo-notif-1",
    instructorId: demoIds.instructor,
    title: "Lesson reminder",
    message: "Jamie Park lesson tomorrow at 09:00.",
    timestamp: Date.now() - 3600000,
    read: false
  },
  {
    id: "demo-notif-2",
    instructorId: demoIds.instructor,
    title: "Payment pending",
    message: "Morgan Ellis has a pending payment from last lesson.",
    timestamp: Date.now() - 86400000,
    read: true
  }
];

const demoWaitingList = [
  {
    id: "demo-wait-1",
    instructorId: demoIds.instructor,
    name: "Casey Lane",
    phone: "07700 900111",
    email: "casey@app7i.demo",
    transmission: "manual",
    notes: "Prefers weekday evenings",
    addedAt: Date.now() - 86400000 * 5
  },
  {
    id: "demo-wait-2",
    instructorId: demoIds.instructor,
    name: "Sam Taylor",
    phone: "07700 900222",
    email: "sam@app7i.demo",
    transmission: "auto",
    notes: "Weekend slots only",
    addedAt: Date.now() - 86400000 * 2
  }
];

const demoInstructorProfile = {
  name: "Alex Morgan",
  phone: "07700 900999",
  email: "instructor@app7i.demo",
  licenceNumber: "DRV1234567",
  adiBadgeNumber: "ADI-7788",
  adiBadgeExpiry: dateString(90),
  hourlyRate: 38,
  bio: "Calm, supportive instructor focused on confidence.",
  areas: "Central Manchester, Salford",
  paymentMethods: "Bank transfer"
};

const demoCarDetails = {
  make: "Ford",
  model: "Focus",
  year: "2022",
  registration: "AB21 XYZ",
  colour: "Blue",
  fuelType: "petrol",
  insuranceExpiry: dateString(45),
  motExpiry: dateString(200),
  mileage: "18500",
  notes: "Last serviced two months ago."
};

const demoStore = {
  users: demoUsers,
  students: demoStudents,
  lessons: demoLessons,
  messages: demoMessages,
  tips: demoTips,
  notifications: demoNotifications,
  waitingList: demoWaitingList,
  instructorProfile: demoInstructorProfile,
  carDetails: demoCarDetails
};

function getDemoRole() {
  if (typeof window === "undefined") return "instructor";
  const params = new URLSearchParams(window.location.search);
  return params.get("demoRole") === "student" ? "student" : "instructor";
}

function getDemoUser() {
  const role = getDemoRole();
  if (role === "student") {
    return { uid: demoIds.studentUser, email: "student@app7i.demo" };
  }
  return { uid: demoIds.instructor, email: "instructor@app7i.demo" };
}

function getDemoUserProfile() {
  const role = getDemoRole();
  if (role === "student") {
    return {
      uid: demoIds.studentUser,
      email: "student@app7i.demo",
      role: "student",
      subscriptionStatus: "active"
    };
  }
  return {
    uid: demoIds.instructor,
    email: "instructor@app7i.demo",
    role: "instructor",
    subscriptionStatus: "active"
  };
}

function getDemoStudentByEmail(email) {
  const normalised = (email || "").trim().toLowerCase();
  return demoStore.students.find((s) => (s.email || "").toLowerCase() === normalised) || null;
}

export {
  DEMO_MODE,
  demoIds,
  demoStore,
  getDemoRole,
  getDemoUser,
  getDemoUserProfile,
  getDemoStudentByEmail,
  dateString,
  timestampAt,
  pad2
};
