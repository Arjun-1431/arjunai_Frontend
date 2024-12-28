import { IKContext, IKUpload } from "imagekitio-react";
import { useRef, useState } from "react";

const urlEndpoint = "https://ik.imagekit.io/hkegnhewz";
const publicKey = "public_Fjo4WPu3lmGYB5Pe7eSHXdgXXyU=";

const authenticator = async () => {
  try {
    // Make sure to use POST method here for the request
    const response = await fetch("arjunai-backend.vercel.app", {
      method: "POST",  // Use POST method
      headers: {
        "Content-Type": "application/json",  // Ensure proper content type
      },
      body: JSON.stringify({}) // Send any required data in the request body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error) {
    console.error("Authentication failed:", error);
    throw new Error("Authentication request failed: " + error.message);
  }
};

const Upload = ({ setImg }) => {
  const ikUploadRef = useRef(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // To store the uploaded image URL

  const onError = (err) => {
    console.log("Error", err);
  };

  const onSuccess = (res) => {
    console.log("Upload Success", res);
    setImg((prev) => ({
      ...prev,
      isLoading: false,
      dbData: res, // Set the uploaded image data in state
    }));

    // Set the URL of the uploaded image
    setUploadedImageUrl(res.url);
  };

  const onUploadProgress = (progress) => {
    console.log("Upload Progress", progress);
  };

  const onUploadStart = (evt) => {
    const file = evt.target.files[0];

    const reader = new FileReader();
    reader.onloadend = () => {
      setImg((prev) => ({
        ...prev,
        isLoading: true,
        aiData: {
          inlineData: {
            data: reader.result.split(",")[1],
            mimeType: file.type,
          },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <IKContext
      urlEndpoint={urlEndpoint}
      publicKey={publicKey}
      authenticator={authenticator}
    >
      <IKUpload
        fileName="test-upload.png"
        onError={onError}
        onSuccess={onSuccess}
        useUniqueFileName={true}
        onUploadProgress={onUploadProgress}
        onUploadStart={onUploadStart}
        style={{ display: "none" }}
        ref={ikUploadRef}
      />
      <label onClick={() => ikUploadRef.current.click()}>
        <img src="/attachment.png" alt="Upload" />
      </label>

      {/* Conditionally render image after successful upload */}
      {/* {uploadedImageUrl && (
  <div style={{ maxWidth: "100%", width: "100%", height: "auto" }}>
    <img
      src={uploadedImageUrl}
      alt="Uploaded"
      style={{
        width: "20%",      // Makes sure the image takes up 100% of the container's width
        height: "auto",     // Keeps the aspect ratio of the image
        objectFit: "contain" // This will ensure the whole image is visible without distortion
      }}
    />
  </div>
)} */}


    </IKContext>
  );
};

export default Upload;
