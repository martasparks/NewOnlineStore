import MainNavigation from "@/components/MainNavigation"
import Slider from "@/components/Slider";

const res = await fetch('http://localhost:3000/api/slider', { cache: 'no-store' })
const slides = await res.json()

export default function Home() {
  return (
    <div>
      <MainNavigation />
      <Slider slides={slides} />
      <main className="px-4 md:px-8 mt-8">
        {/* cits saturs */}
      </main>
    </div>
  );
}
