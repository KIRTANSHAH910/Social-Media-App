import { useAuth } from "@clerk/clerk-expo";
import { useUser } from "@clerk/clerk-expo";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const createUser = useMutation(api.users.createUser);
  const [isUserSynced, setIsUserSynced] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIsUserSynced(false);
      return;
    }

    if (!isUserLoaded || !user) return;

    const syncUser = async () => {
      try {
        const email =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress;

        if (!email) {
          console.error(
            "User is signed in but no email is available from Clerk",
          );
          return;
        }

        const fallbackUsername = email.split("@")[0];
        const firstName = user.firstName || "";
        const lastName = user.lastName || "";
        const fullName =
          `${firstName} ${lastName}`.trim() ||
          user.username ||
          fallbackUsername;

        await createUser({
          clerkId: user.id,
          email,
          fullname: fullName,
          username: user.username || fallbackUsername,
          image: user.imageUrl,
        });

        setIsUserSynced(true);
      } catch (error) {
        console.error("Failed to sync user with Convex:", error);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, isUserLoaded, user, createUser]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && !isUserSynced) return;

    const inAuthScreen = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthScreen) router.replace("/(auth)/login");
    else if (isSignedIn && inAuthScreen) router.replace("/(tabs)");
  }, [isLoaded, isSignedIn, isUserSynced, segments]);

  if (!isLoaded) return null;
  if (isSignedIn && !isUserSynced) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
