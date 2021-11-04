import React, { useState, useRef } from "react";
import QrCamera from "./components/QrCamera";

const App = () => {
  const [facingMode, setFacingMode] = useState("environment");
  const [stopCam, setStopCam] = useState(false);
  const camRef = useRef();

  console.log(camRef.current?.children[1].offsetHeight);

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          minHeight: "-webkit-fill-available",
        }}
      >
        <QrCamera
          ref={camRef}
          reverse={false} // 카메라의 좌우반전 [default: false]
          mode={facingMode} // "user", "environment" [default: "user"]
          stop={stopCam} // video 정지여부 [default: false]
          delay={500} // ms단위 [default: 500]
          onScan={(code) => {
            // 메인 함수
            if (code?.data) {
              // setStopCam(true);
              window.open(code.data, "_blank");
            }
          }}
          onError={(error) => {
            console.log(error);
          }} // 에러가 생겼을 때,
        />
      </div>
      <div style={{ position: "absolute", bottom: 0 }}>
        <button
          onClick={() => {
            if (facingMode === "user") setFacingMode("environment");
            else setFacingMode("user");
          }}
        >
          Change Camera
        </button>
        <button onClick={() => setStopCam(!stopCam)}>Stop</button>
      </div>
    </>
  );
};

export default App;
//
