import { redirect } from 'next/navigation'

export default function GuestLanding() {
  redirect('/main/guest/waiting')
}
