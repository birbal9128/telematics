import React from "react";

export const Loader: React.FC = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 999999999,
      }}
    >
      <img
        src="/images/tractorloader.gif"
        alt="Loading..."
        style={{
          height: "200px",
          width: "auto",
        }}
      />
    </div>
  );
};