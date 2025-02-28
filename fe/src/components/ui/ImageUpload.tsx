'use client'

import { useState } from "react";
import Image from "next/image";
import Button from "./Button";

interface UploadedFile {
  blobId: string;
  url: string;
}

const ImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  async function handleUpload() {
    setIsUploading(true);
    setError(null);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (!fileInput?.files?.[0]) {
      setError("Please select a file");
      setIsUploading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=1`,
        {
          method: "PUT",
          body: fileInput.files[0],
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      const blobId = result.newlyCreated?.blobObject?.blobId || 
                     result.newlyCreated?.blobId ||
                     result.alreadyCertified?.blobId;
                   
      if (blobId) {
        setUploadedFile({
          blobId,
          url: `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`
        });
      } else {
        throw new Error("Could not find blobId in response");
      }
      
      fileInput.value = '';
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  console.log(uploadedFile);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <input 
          type="file" 
          className="block w-full px-3 py-2 border rounded-md"
          accept="image/*"
          required 
        />

        <Button
          onClick={handleUpload}
          isDisabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {uploadedFile && (
        <div className="p-4 border rounded-md">
          <div className="mt-4">
            <Image 
              src={uploadedFile.url} 
              alt="Uploaded preview"
              width={400}
              height={300}
              className="max-w-full h-auto rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;