"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  UserRound,
  Lock,
  Sparkles,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { getInitials } from "@/lib/utils";

interface FirestoreProfile {
  fullName: string;
  role: string;
  phone: string;
  location: string;
  email: string;
}

function formatPhoneNumber(value: string) {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "";

  if (cleaned.length <= 3) {
    return `(${cleaned}`;
  }
  if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return `+${cleaned.slice(0, cleaned.length - 10)} (${cleaned.slice(
    cleaned.length - 10,
    cleaned.length - 7,
  )}) ${cleaned.slice(cleaned.length - 7, cleaned.length - 4)}-${cleaned.slice(
    cleaned.length - 4,
  )}`;
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const profileUid = searchParams.get("uid");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  // General profile state
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isRoleDisabled, setIsRoleDisabled] = useState(true);

  // Security credentials state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // Fetch logged-in user's role to determine privileges
        let loggedInUserRole = "Contributor";
        try {
          const selfDocRef = doc(db, "users", user.uid);
          const selfDocSnap = await getDoc(selfDocRef);
          if (selfDocSnap.exists()) {
            loggedInUserRole = selfDocSnap.data().role || "Contributor";
          }
        } catch (e) {
          console.error("Error fetching self profile:", e);
        }

        // Determine which UID to fetch
        const activeUid =
          profileUid && profileUid !== user.uid ? profileUid : user.uid;
        const isSelf = activeUid === user.uid;

        // Editable if it is their own profile OR if the logged-in user is an Admin
        const readOnly = !isSelf && loggedInUserRole !== "Admin";
        setIsReadOnly(readOnly);

        // Role is editable ONLY if the logged-in user is an Admin AND it is someone else's profile!
        const isRoleEditable = loggedInUserRole === "Admin" && !isSelf;
        setIsRoleDisabled(!isRoleEditable);

        try {
          // Fetch additional profile data from Firestore
          const userDocRef = doc(db, "users", activeUid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as FirestoreProfile;
            setFullName(data.fullName || "");
            setRole(data.role || "Contributor");
            setPhone(formatPhoneNumber(data.phone || ""));
            setLocation(data.location || "");
            setDisplayName(data.fullName || "");
            setEmail(data.email || "");
          } else {
            // Default fallback if no doc exists yet
            if (readOnly) {
              setFullName("User Not Found");
              setRole("Contributor");
              setEmail("");
              setDisplayName("");
            } else {
              setFullName(user.displayName || "");
              setRole("Contributor");
              setDisplayName(user.displayName || "");
              setEmail(user.email || "");
            }
          }
        } catch (error) {
          console.error("Error fetching firestore profile:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileUid]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isReadOnly) return;

    setSavingGeneral(true);
    try {
      const activeUid =
        profileUid && profileUid !== currentUser.uid ? profileUid : currentUser.uid;
      const isSelf = activeUid === currentUser.uid;

      // 1. Update Firebase Auth Profile (DisplayName) ONLY if editing self
      if (isSelf) {
        await updateProfile(currentUser, {
          displayName: displayName,
        });
      }

      // 2. Save additional metadata to Cloud Firestore users/{activeUid}
      const userDocRef = doc(db, "users", activeUid);
      await setDoc(
        userDocRef,
        {
          fullName,
          role,
          phone,
          location,
          email: email, // save the profile's loaded email address
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isReadOnly) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSavingSecurity(true);
    try {
      await updatePassword(currentUser, newPassword);
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password update error:", error);
      if (error.code === "auth/requires-recent-login") {
        toast.error(
          "Please log out and log back in to perform this security action.",
        );
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setSavingSecurity(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="relative size-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const userInitials = getInitials(
    fullName || displayName || email || currentUser?.email || "U",
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Profile Premium Header Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border bg-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        {/* Glow backdrop decorator */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <Avatar className="size-24 md:size-28 border-4 border-background shadow-lg">
          <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
            {userInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight truncate">
              {fullName || "User Profile"}
            </h1>
            {role && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary self-center md:self-auto w-fit">
                <Sparkles className="size-3" />
                {role}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm truncate max-w-lg">
            {isReadOnly ? email : currentUser?.email}
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-sidebar p-1.5 rounded-xl h-13!">
          <TabsTrigger
            value="general"
            className="flex items-center justify-center gap-2 rounded-lg">
            <UserRound className="size-4" />
            General Info
          </TabsTrigger>
          {!isReadOnly && (
            <TabsTrigger
              value="security"
              className="flex items-center justify-center gap-2 rounded-lg">
              <Lock className="size-4" />
              Security & Password
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <form onSubmit={handleUpdateProfile}>
            <Card className="border shadow-sm rounded-2xl overflow-hidden py-0">
              <CardHeader className="border-b bg-muted/20 py-4">
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>
                  {isReadOnly
                    ? "View public metadata and contact settings stored in Firestore."
                    : "Modify the public metadata and contact settings stored in Firestore."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                {isReadOnly && (
                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/10 text-muted-foreground text-sm">
                    <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        Read-only Profile View
                      </p>
                      <p className="font-light mt-0.5">
                        You are viewing this member's profile card.
                        Administrative policies restrict direct modification of
                        other profiles.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Display Name */}
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="profile-displayName">
                      Username / Display Name
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        id="profile-displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="john_doe"
                        disabled={isReadOnly}
                      />
                    </div>
                  </Field>

                  {/* Full Name */}
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="profile-fullName">
                      Full Name
                    </FieldLabel>
                    <Input
                      id="profile-fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      disabled={isReadOnly}
                    />
                  </Field>

                  {/* Role Selection Dropdown */}
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="profile-role">User Role</FieldLabel>
                    <NativeSelect
                      id="profile-role"
                      className="w-full [&>select]:w-full [&>select]:h-10"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      disabled={isRoleDisabled}>
                      <NativeSelectOption value="Admin">
                        Admin
                      </NativeSelectOption>
                      <NativeSelectOption value="Contributor">
                        Contributor
                      </NativeSelectOption>
                    </NativeSelect>
                  </Field>

                  {/* Phone */}
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="profile-phone">
                      Contact Phone
                    </FieldLabel>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        id="profile-phone"
                        className="pl-10"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+1 (555) 000-0000"
                        disabled={isReadOnly}
                      />
                    </div>
                  </Field>

                  {/* Location */}
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="profile-location">Location</FieldLabel>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        id="profile-location"
                        className="pl-10"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="San Francisco, CA"
                        disabled={isReadOnly}
                      />
                    </div>
                  </Field>
                </div>

                {!isReadOnly && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={savingGeneral}
                      className="min-w-[140px]">
                      {savingGeneral ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {!isReadOnly && (
          <TabsContent value="security" className="mt-6">
            <form onSubmit={handleUpdatePassword}>
              <Card className="border shadow-sm rounded-2xl overflow-hidden py-0">
                <CardHeader className="border-b bg-muted/20 py-4">
                  <CardTitle>Account Credentials</CardTitle>
                  <CardDescription>
                    Keep your administrator security tokens up to date.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/10 text-muted-foreground text-sm">
                    <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        Password Security Policy
                      </p>
                      <p className="font-light mt-0.5">
                        Your password must contain at least 6 characters. If you
                        have been signed in for a long duration, you may be
                        asked to re-authenticate before modifying credential
                        databases.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Email (Read Only) */}
                    <Field className="gap-1.5">
                      <FieldLabel htmlFor="security-email">
                        Registered Email
                      </FieldLabel>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3 size-4 text-muted-foreground" />
                        <Input
                          id="security-email"
                          className="pl-10 bg-muted/50 cursor-not-allowed"
                          value={currentUser?.email || ""}
                          disabled
                          readOnly
                        />
                      </div>
                    </Field>

                    <div className="hidden md:block" />

                    {/* New Password */}
                    <Field className="gap-1.5">
                      <FieldLabel htmlFor="security-newPassword">
                        New Password
                      </FieldLabel>
                      <Input
                        id="security-newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </Field>

                    {/* Confirm Password */}
                    <Field className="gap-1.5">
                      <FieldLabel htmlFor="security-confirmPassword">
                        Confirm Password
                      </FieldLabel>
                      <Input
                        id="security-confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={savingSecurity}
                      className="min-w-[140px]">
                      {savingSecurity ? "Updating..." : "Change Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="relative size-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
      }>
      <ProfileContent />
    </Suspense>
  );
}
