import { Layout } from "./ui/Layout";
import { NoteProvider } from "./ui/NoteContext";

function App() {
  return (
    <NoteProvider>
      <div className="antialiased font-sans w-screen h-screen overflow-hidden">
        <Layout />
      </div>
    </NoteProvider>
  );
}

export default App;
