import { redirect } from 'next/navigation';

export default function RootRedirect() {
  // Ja middleware nevirza, šis vienmēr aizvedīs uz noklusēto valodu
  redirect('/lv');
}
