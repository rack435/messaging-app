import { useContext, useCallback } from "react";
import { signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { AuthContext } from "../App";
function SignIn() {
  const auth = useContext(AuthContext);
  const HandleLogin = (provider) => {
    return () => {
      try {
        signInWithRedirect(auth, provider);
      } catch {
        alert("failed to sign-in retry again");
      }
    };
  };
  return (
    <button
      className="sign-in sign"
      id="google"
      onClick={HandleLogin(new GoogleAuthProvider())}
    >
      SignIn with google
    </button>
  );
}
export default SignIn;
