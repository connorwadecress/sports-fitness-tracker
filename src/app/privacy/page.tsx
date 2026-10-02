import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy and safety" };

export default function Privacy() {
  return (
    <div className="stage">
      <div className="device">
        <main className="screen prose" style={{ paddingBottom: 40 }}>
          <Link href="/" className="logit" style={{ textDecoration: "none", display: "inline-block", marginBottom: 16 }}>Back to Pitchside</Link>
          <h1 className="display">Privacy and safety</h1>

          <h2 className="h2">Not medical advice</h2>
          <p>Pitchside gives general guidance based on what you log. It never diagnoses an injury or changes what your physio or biokineticist prescribed. Your physio, biokineticist and coach know your body best.</p>
          <p>If you log pain of 7 out of 10 or more, Pitchside will always tell you to stop training and tell a coach, parent or your physio that day.</p>

          <h2 className="h2">What we store</h2>
          <p>Only what you enter: your email, an optional first name, the events you log (matches, practices, training, physio and biokineticist sessions), how you felt, any pain and injuries, your rehab exercises and photos you add, and how many sets you did. Photos are shrunk to 480 pixels wide before they are saved.</p>
          <p>We don&apos;t collect your location, contacts, weight or calories, and there is no body-shape tracking.</p>

          <h2 className="h2">Who can see it</h2>
          <p>Only you. There are no ads, no data sales and no third-party analytics. Nothing is shared with a physio, coach or anyone else unless you choose to show them.</p>

          <h2 className="h2">Where it lives</h2>
          <p>Your data is saved on your phone first, so the app works without signal. With an account it is also backed up to a private database (Neon Postgres, encrypted at rest) and sent over HTTPS only. Without an account it stays on this device only.</p>

          <h2 className="h2">Under 18?</h2>
          <p>Training and health information about a child is special personal information under South Africa&apos;s Protection of Personal Information Act (POPIA). A parent or guardian must agree before you create an account.</p>

          <h2 className="h2">Your control</h2>
          <p>You can export everything as a CSV file, and delete your account and all your data at any time, from the person icon on the Today screen.</p>
        </main>
      </div>
    </div>
  );
}
