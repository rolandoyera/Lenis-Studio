"use client";

import { Suspense, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { format } from "date-fns";
import { onAuthStateChanged, type User, updatePassword, updateProfile } from "firebase/auth";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { Edit, Lock, Mail, MapPin, MoreVertical, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, db } from "@/lib/firebase";
import { getInitials } from "@/lib/utils";

interface FirestoreProfile {
  fullName: string;
  displayName?: string;
  role: string;
  phone: string;
  location: string;
  email: string;
  status?: string;
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
  )}) ${cleaned.slice(cleaned.length - 7, cleaned.length - 4)}-${cleaned.slice(cleaned.length - 4)}`;
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
  const [isSelf, setIsSelf] = useState(true);
  const [status, setStatus] = useState("Active");
  const [loggedInUserRole, setLoggedInUserRole] = useState("Contributor");
  const [isResending, setIsResending] = useState(false);

  // Edit Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");

  // Security credentials state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResendInvite = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      const emailKey = email.trim().toLowerCase();
      // 1. Update the joinedDate in Firestore under users/{emailKey}
      const userDocRef = doc(db, "users", emailKey);
      await setDoc(
        userDocRef,
        {
          joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
        },
        { merge: true },
      );

      // 2. Add email trigger document to mail collection
      await addDoc(collection(db, "mail"), {
        to: emailKey,
        message: {
          subject: "You've been invited!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome, ${fullName}!</h2>
              <p style="color: #334155; font-size: 16px; line-height: 1.5;">
                You have been invited to join Sarvian Design Group CRM.
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Click the button below to sign in and activate your account:
              </p>
              <a href="${window.location.origin}/auth/invite?email=${emailKey}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Set Up Account & Get Started
              </a>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />
              <p style="color: #64748b; font-size: 12px; text-align: center;">
                Sarvian Design Group CRM invitation. If you did not expect this, please ignore this email.
              </p>
            </div>
          `,
        },
      });

      toast.success("Invitation email resent successfully!");
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // Fetch logged-in user's role to determine privileges
        let selfRole = "Contributor";
        try {
          const selfDocRef = doc(db, "users", user.uid);
          const selfDocSnap = await getDoc(selfDocRef);
          if (selfDocSnap.exists()) {
            selfRole = selfDocSnap.data().role || "Contributor";
          }
        } catch (e) {
          console.error("Error fetching self profile:", e);
        }
        setLoggedInUserRole(selfRole);

        // Determine which UID to fetch
        const activeUid = profileUid && profileUid !== user.uid ? profileUid : user.uid;
        const isSelf = activeUid === user.uid;
        setIsSelf(isSelf);

        // Editable if it is their own profile OR if the logged-in user is an Admin
        const readOnly = !isSelf && selfRole !== "Admin";
        setIsReadOnly(readOnly);

        // Role is editable ONLY if the logged-in user is an Admin AND it is someone else's profile!
        const isRoleEditable = selfRole === "Admin" && !isSelf;
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
            setLocation(data.location ? String(data.location) : "");
            setDisplayName(data.displayName || (isSelf ? user.displayName : "") || "");
            setEmail(data.email || "");
            setStatus(data.status || "Active");
          } else {
            // Default fallback if no doc exists yet
            if (readOnly) {
              setFullName("User Not Found");
              setRole("Contributor");
              setEmail("");
              setDisplayName("");
            } else {
              setFullName(isSelf ? user.displayName || "" : "");
              setRole("Contributor");
              setDisplayName(isSelf ? user.displayName || "" : "");
              setEmail(isSelf ? user.email || "" : "");
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSavingGeneral(true);
    try {
      const activeUid = profileUid && profileUid !== currentUser.uid ? profileUid : currentUser.uid;
      const isSelf = activeUid === currentUser.uid;

      // 1. Update Firebase Auth Profile (DisplayName) ONLY if editing self
      if (isSelf) {
        await updateProfile(currentUser, {
          displayName: editDisplayName,
        });
      }

      // 2. Save additional metadata to Cloud Firestore users/{activeUid}
      const userDocRef = doc(db, "users", activeUid);
      await setDoc(
        userDocRef,
        {
          fullName: editFullName,
          displayName: editDisplayName,
          role: editRole,
          phone: editPhone,
          location: editLocation,
          email: email, // save the profile's loaded email address
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      // 3. Sync states
      setFullName(editFullName);
      setDisplayName(editDisplayName);
      setRole(editRole);
      setPhone(editPhone);
      setLocation(editLocation);

      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
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
        toast.error("Please log out and log back in to perform this security action.");
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

  const userInitials = getInitials(fullName || displayName || email || currentUser?.email || "U");

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
            <h1 className="text-3xl font-bold tracking-tight truncate">{fullName || "User Profile"}</h1>
            {role && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary self-center md:self-auto w-fit">
                <Sparkles className="size-3" />
                {role}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm truncate max-w-lg">{email}</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList
          className={`grid w-full max-w-md bg-sidebar p-1.5 rounded-xl h-13! ${isSelf ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <TabsTrigger value="general" className="flex items-center justify-center gap-2 rounded-lg">
            <UserRound className="size-4" />
            General Info
          </TabsTrigger>
          {isSelf && (
            <TabsTrigger value="security" className="flex items-center justify-center gap-2 rounded-lg">
              <Lock className="size-4" />
              Security & Password
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="border shadow-sm rounded-2xl overflow-hidden py-0">
            <CardHeader className="border-b bg-muted/20 py-4">
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>View or edit your profile information.</CardDescription>
              {(isSelf || (!isSelf && loggedInUserRole === "Admin")) && (
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-9 rounded-full cursor-pointer">
                        <MoreVertical className="size-5" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 mt-1">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setEditDisplayName(displayName);
                          setEditFullName(fullName);
                          setEditRole(role);
                          setEditPhone(phone);
                          setEditLocation(location);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Edit className="size-4" />
                        Edit Profile
                      </DropdownMenuItem>

                      {!isSelf && loggedInUserRole === "Admin" && (
                        <DropdownMenuItem
                          onClick={handleResendInvite}
                          disabled={status !== "Pending" || isResending}
                          className={`flex items-center gap-2 ${
                            status === "Pending" && !isResending ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <Mail className="size-4" />
                          {isResending ? "Resending..." : "Resend Invite"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Display Name */}
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="profile-displayName">Username / Display Name</FieldLabel>
                  <div className="relative">
                    <Input id="profile-displayName" value={displayName} disabled />
                  </div>
                </Field>

                {/* Full Name */}
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="profile-fullName">Full Name</FieldLabel>
                  <Input id="profile-fullName" value={fullName} disabled />
                </Field>

                {/* Role Selection Dropdown */}
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="profile-role">User Role</FieldLabel>
                  <NativeSelect
                    id="profile-role"
                    className="w-full [&>select]:w-full [&>select]:h-10"
                    value={role}
                    disabled
                  >
                    <NativeSelectOption value="Admin">Admin</NativeSelectOption>
                    <NativeSelectOption value="Contributor">Contributor</NativeSelectOption>
                  </NativeSelect>
                </Field>

                {/* Phone */}
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="profile-phone">Contact Phone</FieldLabel>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3 size-4 text-muted-foreground" />
                    <Input id="profile-phone" className="pl-10" value={phone} disabled />
                  </div>
                </Field>

                {/* Location */}
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="profile-location">Location</FieldLabel>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 size-4 text-muted-foreground" />
                    <Input id="profile-location" className="pl-10" value={location} disabled />
                  </div>
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isSelf && (
          <TabsContent value="security" className="mt-6">
            <form onSubmit={handleUpdatePassword}>
              <Card className="border shadow-sm rounded-2xl overflow-hidden py-0">
                <CardHeader className="border-b bg-muted/20 py-4">
                  <CardTitle>Account Credentials</CardTitle>
                  <CardDescription>Keep your administrator security tokens up to date.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/10 text-muted-foreground text-sm">
                    <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Password Security Policy</p>
                      <p className="font-light mt-0.5">
                        Your password must contain at least 6 characters. If you have been signed in for a long
                        duration, you may be asked to re-authenticate before modifying credential databases.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Email (Read Only) */}
                    <Field className="gap-1.5">
                      <FieldLabel htmlFor="security-email">Registered Email</FieldLabel>
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
                      <FieldLabel htmlFor="security-newPassword">New Password</FieldLabel>
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
                      <FieldLabel htmlFor="security-confirmPassword">Confirm Password</FieldLabel>
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
                    <Button type="submit" disabled={savingSecurity} className="min-w-[140px]">
                      {savingSecurity ? "Updating..." : "Change Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveProfile}>
            <DialogHeader className="mb-4">
              <DialogTitle>Edit Profile Details</DialogTitle>
              <DialogDescription>Update your profile and contact information.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Display Name */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="modal-displayName">Username / Display Name</FieldLabel>
                <Input
                  id="modal-displayName"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  required
                />
              </Field>

              {/* Full Name */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="modal-fullName">Full Name</FieldLabel>
                <Input
                  id="modal-fullName"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </Field>

              {/* Role Selection Dropdown */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="modal-role">User Role</FieldLabel>
                <NativeSelect
                  id="modal-role"
                  className="w-full [&>select]:w-full [&>select]:h-10"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={isRoleDisabled}
                >
                  <NativeSelectOption value="Admin">Admin</NativeSelectOption>
                  <NativeSelectOption value="Contributor">Contributor</NativeSelectOption>
                </NativeSelect>
              </Field>

              {/* Phone */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="modal-phone">Contact Phone</FieldLabel>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 size-4 text-muted-foreground" />
                  <Input
                    id="modal-phone"
                    className="pl-10"
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatPhoneNumber(e.target.value))}
                  />
                </div>
              </Field>

              {/* Location */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="modal-location">Location</FieldLabel>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3 size-4 text-muted-foreground" />
                  <Input
                    id="modal-location"
                    className="pl-10"
                    placeholder="5-digit ZIP code"
                    value={editLocation}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 5);
                      setEditLocation(clean);
                    }}
                  />
                </div>
              </Field>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingGeneral} className="min-w-[120px]">
                {savingGeneral ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
