import { useState } from "react";

// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://fdbs-server-a9gqg.ondigitalocean.app/api";

const PICKUP_LOCATION_OPTIONS = [
    "Nangloi",
    "Gurugram",
    "Jamia",
    "Sangam Vihar Shamshan Ghat",
    "Maidangarhi",
    "Hari Nagar",
    "Nawada Metro",
    "Dwarka",
    "Pankha Road",
    "Uttam Nagar",
    "Dakshinpuri",
    "Palam",
    "Maruti Gate",
    "Sector 14",
    "Kapashera Border",
    "Jafrabad",
    "Geeta Colony",
    "Khajuri",
    "DLF Ankur Vihar",
    "Delhi Police",
    "Cyber City",
    "Satya Vihar",
    "Burari Chowk",
    "Mukundpur Gol Chakkar",
    "Rohini Sector 16",
    "Naharpur Rohini",
    "Paschim Vihar",
    "Kanya Nagar Delhi",
    "Zakir Nagar",
    "Govindpuri",
    "Madangir",
    "Jhilmil Madawli",
    "South Extension",
    "Chhattarpur",
    "Kotla, South Extension",
    "Kishangarh",
    "Sultanpur",
];

const OTHER_OPTION = "__OTHER__";
export default function PublicEmployeeDetails() {
    const [step, setStep] = useState(1); // 1 = login, 2 = form, 3 = success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // auth
    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);

    // login form
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // details form
    const [officeLocation, setOfficeLocation] = useState("");
    const [currentAddress, setCurrentAddress] = useState("");
    const [pickupLocation, setPickupLocation] = useState("");
    const [pickupSelection, setPickupSelection] = useState("");     // dropdown selection
    const [pickupCustom, setPickupCustom] = useState("");
    const [transportOffice, setTransportOffice] = useState("");

    // ─────────────── Step 1: verify credentials ───────────────
    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/public/employee-details/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Login failed");

            setToken(data.token);
            setUser(data.user);

            // pre-fill if controller returns existing values
            setOfficeLocation(data.user?.officeLocation || "");
            setCurrentAddress(data.user?.currentAddress || "");
            setPickupLocation(data.user?.pickupLocation || "");
            setTransportOffice(
                data.user?.transportOffice === "Yes"
                    ? "Require"
                    : data.user?.transportOffice === "No"
                        ? "Not Require"
                        : data.user?.transportOffice === "Require" ||
                            data.user?.transportOffice === "Not Require"
                            ? data.user.transportOffice
                            : ""
            );

            setStep(2);
        } catch (err) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // ─────────────── Step 2: submit details ───────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!transportOffice) {
            setError("Please select a Transport Office option.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/public/employee-details/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    officeLocation: officeLocation.trim(),
                    currentAddress: currentAddress.trim(),
                    pickupLocation: pickupLocation.trim(),
                    transportOffice,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Submission failed");

            setUser((prev) => ({ ...prev, ...data.user }));
            setStep(3);
        } catch (err) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const resetAll = () => {
        setStep(1);
        setUsername("");
        setPassword("");
        setToken("");
        setUser(null);
        setOfficeLocation("");
        setCurrentAddress("");
        setPickupLocation("");
        setTransportOffice("");
        setError("");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-sky-50 p-5 font-sans text-slate-900">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 px-7 py-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600" />
                    <h1 className="text-xl font-bold tracking-tight">Employee Details Form</h1>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                        {step === 1 && "Log in with your company credentials to continue."}
                        {step === 2 &&
                            `Hi ${user?.realName || user?.username || ""}, please fill in your details.`}
                        {step === 3 && "Your details have been saved."}
                    </p>
                </div>

                {/* Step 1 — Login */}
                {step === 1 && (
                    <form onSubmit={handleVerify} className="flex flex-col">
                        <label className="text-[13px] font-semibold text-slate-700 mt-3.5 mb-1.5">
                            Username / Emp ID
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. john.doe or 119461"
                            autoComplete="username"
                            required
                            disabled={loading}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white outline-none transition
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                         disabled:bg-slate-50 disabled:text-slate-400"
                        />

                        <label className="text-[13px] font-semibold text-slate-700 mt-3.5 mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            disabled={loading}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white outline-none transition
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                         disabled:bg-slate-50 disabled:text-slate-400"
                        />

                        {error && (
                            <div className="mt-3 px-3 py-2.5 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-5 w-full py-3 text-sm font-semibold text-white rounded-lg
                         bg-gradient-to-r from-blue-600 to-violet-600
                         hover:opacity-95 active:opacity-90 transition
                         disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Verifying…" : "Continue"}
                        </button>
                    </form>
                )}

                {/* Step 2 — Details */}
                {step === 2 && (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <label className="text-[13px] font-semibold text-slate-700 mt-3.5 mb-1.5">
                            Office Location
                        </label>
                        <select
                            value={officeLocation}
                            onChange={(e) => setOfficeLocation(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white outline-none transition
             focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
             disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option value="" disabled>
                                Select an office location
                            </option>
                            <option value="SUNCITY">SUNCITY</option>
                            <option value="UDYOG VIHAR">UDYOG VIHAR</option>
                        </select>

                        <label className="text-[13px] font-semibold text-slate-700 mt-3.5 mb-1.5">
                            Current Address
                        </label>
                        <textarea
                            value={currentAddress}
                            onChange={(e) => setCurrentAddress(e.target.value)}
                            placeholder="Full current residential address"
                            required
                            disabled={loading}
                            rows={3}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white outline-none transition
                         resize-y min-h-[90px]
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                         disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <label className="text-[13px] font-semibold text-slate-700 mt-3.5 mb-1.5">
  Pickup Location
</label>
<select
  value={pickupSelection}
  onChange={(e) => {
    const val = e.target.value;
    setPickupSelection(val);
    if (val === OTHER_OPTION) {
      // keep whatever was typed before, or clear
      setPickupLocation(pickupCustom.trim());
    } else {
      setPickupCustom("");
      setPickupLocation(val);
    }
  }}
  disabled={loading}
  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white outline-none transition
             focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
             disabled:bg-slate-50 disabled:text-slate-400"
>
  <option value="" disabled>
    Select a pickup location
  </option>
  {PICKUP_LOCATION_OPTIONS.map((loc) => (
    <option key={loc} value={loc}>
      {loc}
    </option>
  ))}
  <option value={OTHER_OPTION}>Other (type manually)</option>
</select>

{pickupSelection === OTHER_OPTION && (
  <input
    type="text"
    value={pickupCustom}
    onChange={(e) => {
      const val = e.target.value;
      setPickupCustom(val);
      setPickupLocation(val.trim());
    }}
    placeholder="Type your pickup location"
    disabled={loading}
    required
    className="mt-2 w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white outline-none transition
               focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
               disabled:bg-slate-50 disabled:text-slate-400"
  />
)}

                        <label className="text-[13px] font-semibold text-slate-700 mt-3.5 mb-1.5">
                            Transport Office
                        </label>
                        <select
                            value={transportOffice}
                            onChange={(e) => setTransportOffice(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white outline-none transition
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                         disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option value="" disabled>
                                Select an option
                            </option>
                            <option value="Require">Require</option>
                            <option value="Not Require">Not Require</option>
                        </select>

                        {error && (
                            <div className="mt-3 px-3 py-2.5 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !transportOffice}
                            className="mt-5 w-full py-3 text-sm font-semibold text-white rounded-lg
                         bg-gradient-to-r from-blue-600 to-violet-600
                         hover:opacity-95 active:opacity-90 transition
                         disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Submitting…" : "Submit Details"}
                        </button>

                        <button
                            type="button"
                            onClick={resetAll}
                            disabled={loading}
                            className="mt-2.5 w-full py-2.5 text-[13px] font-medium text-slate-600
                         rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                        >
                            ← Back to login
                        </button>
                    </form>
                )}

                {/* Step 3 — Success */}
                {step === 3 && (
                    <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 text-green-600 text-2xl font-bold grid place-items-center">
                            ✓
                        </div>
                        <h2 className="text-lg font-bold">Details submitted successfully</h2>
                        <p className="mt-2 mb-5 text-sm text-slate-500 leading-relaxed">
                            Thanks {user?.realName || user?.username || ""}. Your information has been saved
                            to your employee profile.
                        </p>

                        <div className="text-left bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 mb-2">
                            <SummaryRow label="Office Location" value={user?.officeLocation || "—"} />
                            <SummaryRow label="Current Address" value={user?.currentAddress || "—"} />
                            <SummaryRow
                                label="Transport Office"
                                value={user?.transportOffice === "Yes" ? "Require" : "Not Require"}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={resetAll}
                            className="mt-5 w-full py-3 text-sm font-semibold text-white rounded-lg
                         bg-gradient-to-r from-blue-600 to-violet-600
                         hover:opacity-95 active:opacity-90 transition"
                        >
                            Submit another response
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-4 text-xs text-slate-400 text-center">
                Your credentials are never stored in the browser.
            </p>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between gap-3 py-1.5 text-[13px]">
            <span className="text-slate-500 font-medium">{label}</span>
            <span className="text-slate-900 font-semibold text-right break-words">{value}</span>
        </div>
    );
}