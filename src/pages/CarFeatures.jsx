import { useParams, Link } from "react-router-dom";

function CarFeatures() {
  const { id } = useParams();

  const features = [
    { title: "Cockpit Drill", status: "Needs Practice" },
    { title: "Mirrors & Blind Spots", status: "Completed" },
    { title: "Steering Control", status: "Needs Practice" },
    { title: "Clutch Control", status: "Not Started" },
    { title: "Gears (1–5 + Reverse)", status: "Not Started" },
    { title: "Handbrake & Footbrake", status: "Completed" },
    { title: "Indicators & Signals", status: "Completed" },
    { title: "Reference Points", status: "Needs Practice" },
    { title: "Dashboard Warning Lights", status: "Not Started" },
    { title: "Tyres, Brakes, Fluids", status: "Not Started" },
    { title: "Show Me / Tell Me Questions", status: "Needs Practice" },
  ];

  const card =
    "p-4 border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer";

  const statusStyle = (status) => {
    if (status === "Completed") return "text-green-600 font-medium";
    if (status === "Needs Practice") return "text-yellow-600 font-medium";
    return "text-gray-500 font-medium";
  };

  return (
    <div className="p-6 space-y-6">

      <Link to={`/student/${id}`} className="text-blue-600">
        ← Back to Profile
      </Link>

      <h1 className="text-3xl font-semibold">Car & Features</h1>

      <p className="text-gray-600">
        Everything the student needs to know about the car before and during driving.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((item, index) => (
          <div key={index} className={card}>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className={`mt-2 ${statusStyle(item.status)}`}>{item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CarFeatures;