import Header from "@/components/Header"
import MainNavigation from "@/components/MainNavigation"
import Slider from "@/components/Slider";

// Server komponente - pārceļam fetch uz server side
async function getSlides() {
  try {
    const res = await fetch(`${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000'}/api/slider`, { 
      cache: 'no-store' 
    })
    if (!res.ok) {
      throw new Error('Failed to fetch slides')
    }
    return res.json()
  } catch (error) {
    console.error('Error fetching slides:', error)
    return []
  }
}

export default async function Home() {
  const slides = await getSlides()

  return (
    <div>
      <Header />
      <MainNavigation />
      <Slider slides={slides} />
      <main className="px-4 md:px-8 mt-8">
        {/* cits saturs */}
      </main>
    </div>
  );
}