import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db, storage } from "../../firebase/firebase";
import { deleteObject, ref } from "firebase/storage";
import { AuthContext } from "../Layout";
import { useProfilePictures } from "../../contexts/ProfilePicturesProvider";
const linkRegex =
  /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/g;
function ChatMessage({
  value,
  messages,
  uid,
  type,
  docId,
  ImageName,
  isFirstMessage,
  setLoadingMore,
  Limit,
}) {
  const [DisplayMenu, setDisplayMenu] = useState(false);
  const profilePictures = useProfilePictures();
  const [Deleted, setDeleted] = useState(false);
  const { auth } = useContext(AuthContext);
  const receiverORsender = uid === auth.currentUser.uid;
  const LastMessageRef = useRef();
  useEffect(() => {
    let TimeOut;
    const observer = isFirstMessage
      ? new IntersectionObserver(
          (entries) => {
            entries.map((entry) => {
              if (!entry.isIntersecting) return;
              setLoadingMore(true);
              TimeOut = setTimeout(() => {
                setLoadingMore(false);
                Limit.current = Limit.current + 15;
              }, 1000);
            });
          },
          { threshold: 0.5 }
        )
      : null;
    isFirstMessage && observer.observe(LastMessageRef.current);
    return () => {
      isFirstMessage && typeof TimeOut === "number" && clearTimeout(TimeOut);
      isFirstMessage && observer.disconnect();
    };
  }, [isFirstMessage]);
  const handleUnSendMessage = useCallback(() => {
    setDeleted(true);
    const docRef = doc(db, "messages", docId);
    setTimeout(async () => {
      try {
        const deleteDocument = await deleteDoc(docRef);
        setDisplayMenu(false);
      } catch (error) {
        console.log({ error });
        alert("failed to delete doc");
      } finally {
        if (type === "text") return;
        const isThisImageUsedInAnotherMessage = messages?.filter(
          ({ type, ImageName: value }) => type !== "text" && value === ImageName
        );
        console.log({ isThisImageUsedInAnotherMessage });
        if (isThisImageUsedInAnotherMessage?.length > 1) return;
        const deleteImg = await deleteObject(
          ref(storage, `/files/${ImageName}`)
        );
      }
    }, 550);
  }, [docId, ImageName]);
  return (
    <div
      className={`message ${receiverORsender ? "sent" : "received"} ${
        Deleted ? "deleted" : ""
      }`}
      ref={isFirstMessage ? LastMessageRef : null}
    >
      <Suspense fallback={<div className="spinner small"></div>}>
        <img
          src={profilePictures[uid] || "/Profile_avatar_placeholder_large.png"}
          className="user"
          loading="eager"
          alt="USER IMAGE"
          referrerPolicy="no-referrer"
        />
      </Suspense>
      {type === "text" ? (
        <p>
          {value.split(" ").map((textPart, i) => {
            const joinedText = textPart + " ";
            if (textPart.match(linkRegex)) {
              return (
                <a href={textPart} key={i + 1} target="_blank">
                  {joinedText}
                </a>
              );
            }
            return joinedText;
          })}
        </p>
      ) : (
        <img src={value} loading="lazy" className="messageImg" alt="Image" />
      )}
      {receiverORsender ? (
        <div className="unSendContainer">
          <svg
            aria-label="More"
            color="rgb(245, 245, 245)"
            className="threeDots"
            fill="rgb(245, 245, 245)"
            height="16"
            role="img"
            onClick={() => setDisplayMenu((prev) => !prev)}
            viewBox="0 0 24 24"
            width="16"
          >
            <title>More</title>
            <circle cx="12" cy="12" r="1.5"></circle>
            <circle cx="6" cy="12" r="1.5"></circle>
            <circle cx="18" cy="12" r="1.5"></circle>
          </svg>
          <button
            type="button"
            className="unSend"
            style={{ display: DisplayMenu ? "initial" : "none" }}
            onClick={handleUnSendMessage}
          >
            UNSEND
          </button>
        </div>
      ) : null}
    </div>
  );
}
export default ChatMessage;
