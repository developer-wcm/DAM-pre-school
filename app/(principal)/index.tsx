import { Redirect } from 'expo-router';

export default function PrincipalIndex() {
  // Admin and Principal share the same dashboard
  // Redirect to the shared dashboard
  return <Redirect href="/(dashboard)" />;
}
