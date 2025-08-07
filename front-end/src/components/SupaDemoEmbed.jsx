import React from "react";

const SupademoEmbed = () => (
  <div
    style={{
      position: "relative",
      boxSizing: "content-box",
      maxHeight: "80vh",
      width: "100%",
      aspectRatio: "0.47591522157996147",
      padding: "40px 0",
    }}
  >
    <iframe
      src="https://app.supademo.com/embed/cme0iau3700su060ibdscwcln?embed_v=2&utm_source=embed"
      loading="lazy"
      title="DewList Product Demo"
      allow="clipboard-write"
      frameBorder="0"
      allowFullScreen
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    ></iframe>
  </div>
);

export default SupademoEmbed;
