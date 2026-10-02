import App from "@/components/App";

// The whole app is one static, client-rendered shell so the service worker can
// serve it offline. Tabs and sheets are client state.
export default function Home() {
  return <App />;
}
