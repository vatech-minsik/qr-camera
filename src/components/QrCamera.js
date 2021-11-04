import React, { useRef, useEffect, forwardRef } from "react";
import { makeStyles } from "@material-ui/core";
import jsQR from "jsqr";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    display: "none",
  },
  canvas: {
    transform: (props) => props.reverse && "rotateY(180deg)",
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}));

const QrCamera = forwardRef((props, ref) => {
  const {
    mode = "user",
    onScan = () => {},
    onError = () => {},
    delay = 500,
    stop = false,
  } = props;
  const classes = useStyles(props);

  const rootRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const { mediaDevices } = navigator;
    const userMedia = mediaDevices.getUserMedia({
      video: {
        height: { ideal: window.innerHeight },
        facingMode: mode,
      },
      audio: false,
    });
    try {
      userMedia.then((stream) => {
        if (stop) stream.getTracks().forEach((track) => track.stop());
        else videoRef.current.srcObject = stream;
      });
    } catch (err) {
      console.error(err);
      onError(err);
    }

    return () =>
      userMedia.then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
  }, [mode, stop, onError]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const ctx = canvas.getContext("2d");

    let frameReq = null;
    let qrData = null;

    const timeout = setInterval(async () => {
      !stop && (await onScan(qrData));
      qrData = null;
    }, delay);

    const tick = () => {
      if (canvas) {
        try {
          const videoRatio = video.videoWidth / video.videoHeight;
          const width = root.getBoundingClientRect().height * videoRatio;
          const height = root.getBoundingClientRect().height;

          const correctedX = width / 2 - width / 4;
          const correctedY = height / 2 - width / 4;

          const drawLine = (begin, end, color) => {
            ctx.beginPath();
            ctx.moveTo(begin.x + correctedX, begin.y + correctedY);
            ctx.lineTo(end.x + correctedX, end.y + correctedY);
            ctx.setLineDash([5]);
            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();
          };

          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = width;
            canvas.height = height;

            ctx.filter = "blur(10px)";
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.setLineDash([5]);
            ctx.strokeStyle = "#00897b";
            ctx.lineWidth = 6;
            ctx.filter = "blur(0px)";
            ctx.drawImage(
              video,
              video.videoWidth / 2 - video.videoWidth / 4,
              video.videoHeight / 2 - video.videoWidth / 4,
              video.videoWidth / 2,
              video.videoWidth / 2,
              correctedX,
              correctedY,
              width / 2,
              width / 2
            );
            ctx.strokeRect(correctedX, correctedY, width / 2, width / 2);

            const imageData = ctx.getImageData(
              correctedX,
              correctedY,
              width / 2,
              width / 2
            );
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: "dontInvert",
              }
            );
            if (code && code?.data !== "") {
              drawLine(
                code.location.topLeftCorner,
                code.location.topRightCorner,
                "#FF3B58"
              );
              drawLine(
                code.location.topRightCorner,
                code.location.bottomRightCorner,
                "#FF3B58"
              );
              drawLine(
                code.location.bottomRightCorner,
                code.location.bottomLeftCorner,
                "#FF3B58"
              );
              drawLine(
                code.location.bottomLeftCorner,
                code.location.topLeftCorner,
                "#FF3B58"
              );
              qrData = code;
            }
          }
          frameReq = requestAnimationFrame(tick);
        } catch (err) {
          console.error(
            "QrCamera Component를 사용하기 위해선,\n 먼저 부모 Component의 너비와 높이를 설정해주세요."
          );
          clearInterval(timeout);
          cancelAnimationFrame(frameReq);
        }
      }
    };
    frameReq = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameReq);
      clearInterval(timeout);
    };
  }, [onScan, delay, stop, onError]);

  return (
    <div
      className={classes.root}
      ref={(divRef) => {
        rootRef.current = divRef;
        ref.current = divRef;
      }}
    >
      <video ref={videoRef} autoPlay className={classes.video} playsInline />
      <canvas ref={canvasRef} className={classes.canvas} />
    </div>
  );
});

export default QrCamera;
