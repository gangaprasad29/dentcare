import {
  SignUpButton,
  SignInButton,
  SignOutButton,
  SignedOut,
  SignedIn,
} from "@clerk/nextjs";

export default function Home() {
  return (
    <div>
      <h1>Home Page</h1>

      <SignedOut>
        <SignInButton mode="modal">
          Sign In
        </SignInButton>

        <SignUpButton mode="modal">
          Sign Up
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <SignOutButton>
          Logout
        </SignOutButton>
      </SignedIn>
    </div>
  );
}
