import { lazy, createContext, useEffect, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { auth, db } from "../firebase/firebase";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
const SignOut = lazy(() => import("./signOut"));
export const AuthContext = createContext(null);

function Layout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const Location = useLocation();
  useEffect(() => {
    const unListen = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (Location.pathname === "/updateProfile" && user) return;
      navigate(user ? "/chatroom" : "/signin");
      if (!user) return;
      if ((await getDoc(doc(db, "users", user.uid))).exists()) return;
      await setDoc(doc(db, "users", user.uid), {
        ProfilePicture: user.photoURL,
      });
    });
    return () => {
      unListen();
    };
  }, []);
  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{user ? "Chatroom" : "Login page"}</title>
        </Helmet>
      </HelmetProvider>
      <AuthContext.Provider value={{ auth, user }}>
        <div className="app">
          <header>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {user && (
                <Link to={"updateProfile"}>
                  <img
                    src={user.photoURL}
                    className="updateProfile"
                    referrerPolicy="no-referrer"
                    loading="eager"
                  />
                </Link>
              )}
              <h1>⚛️🔥💬</h1>
            </div>
            {user && <SignOut />}
          </header>
          <main>
            <Outlet />
          </main>
        </div>
      </AuthContext.Provider>
    </>
  );
}

export default Layout;
