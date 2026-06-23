import { Redirect } from "expo-router";

// Root index defers to auth layout redirect
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
