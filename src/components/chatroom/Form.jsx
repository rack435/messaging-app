import { useState, useContext, useCallback, memo, useRef } from "react";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { AuthContext } from "../../App";
import Picker from "@emoji-mart/react";
import EmojiData from "@emoji-mart/data";
import imgInput from "../../assets/image-solid.svg";
import useReader from "../../hooks/useReader";
import storage from "../../firebase/storage";
function Form({ messagesRef }) {
  const [message, setMessage] = useState("");
  const [ShowEmojiPicker, setShowEmojiPicker] = useState(false);
  const reader = useReader();
  const [Img, setImg] = useState(null);
  const fileInputRef = useRef(null);
  const auth = useContext(AuthContext);
  const handleInputChange = useCallback(
    (e) => {
      if (!e.target.files.length) {
        alert("no files were selected");
        setImg(null);
        return;
      }
      const file = e.target.files[0];
      console.log({ file });
      setImg(reader(file));
      if (!Img) return;
      URL.revokeObjectURL(Img.url);
    },
    [Img]
  );
  const handleOpenEmojiPicker = useCallback(
    () => setShowEmojiPicker((prev) => !prev),
    []
  );

  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        let downloadUrl = "";
        if (Img) {
          const storageRef = ref(storage, `/files/${Img.blob.name}`);
          const uploadTask = await uploadBytesResumable(
            storageRef,
            Img.blob
          ).catch((err) => {
            console.log({ err });
            alert("failed to upload file");
          });
          downloadUrl = await getDownloadURL(uploadTask.ref);
        }
        addDoc(messagesRef, {
          type: Img ? "Image" : "text",
          value: Img ? downloadUrl : message,
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          photoURL: auth.currentUser.photoURL,
        });
      } catch (error) {
        alert("failed to send your message please try again");
      } finally {
        if (message) {
          setMessage("");
          return;
        }
        URL.revokeObjectURL(Img.url);
        setImg(null);
      }
    },
    [message, auth, Img]
  );
  console.log({ EmojiData });
  const handleEmojiClick = useCallback(
    (emoji) => {
      const newMessage = message + emoji.native;
      setMessage(newMessage);
    },
    [message]
  );
  const handleChange = useCallback(
    ({ target: { value } }) => setMessage(value),
    []
  );
  const handleImgChange = useCallback(() => fileInputRef.current.click(), []);
  return (
    <>
      {ShowEmojiPicker && (
        <Picker data={EmojiData} onEmojiSelect={handleEmojiClick} />
      )}
      <form onSubmit={sendMessage}>
        {Img ? (
          <img src={Img.url} alt="Selected Image" className="displayImg" />
        ) : null}
        <input
          type="text"
          value={message}
          placeholder="Write a message"
          disabled={Img}
          onChange={handleChange}
        />
        <button type="button" disabled={message} className="imgInput" onClick={handleImgChange}>
          <img src={imgInput} alt="Image Svg" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: "none" }}
        />
        <button type="button" onClick={handleOpenEmojiPicker}>
          {ShowEmojiPicker ? "Hide" : "Show"} Emoji Picker
        </button>
        <button disabled={!message && !Img} type="submit">
          send
        </button>
      </form>
    </>
  );
}
export default memo(Form);
