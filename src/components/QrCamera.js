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
        if (stop) {
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        } else videoRef.current.srcObject = stream;
      });
    } catch (err) {
      console.error(err);
      onError(err);
    }

    // return () =>
    //   userMedia.then((stream) => {
    //     stream.getTracks().forEach((track) => track.stop());
    //   });
  }, [mode, stop, onError]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const ctx = canvas.getContext("2d");

    let frameReq = null;
    let qrData = null;

    console.log("root", root.clientWidth + " / " + root.clientHeight);
    console.log("video", video.videoWidth + " / " + video.videoHeight);

    const timeout = setInterval(() => {
      !stop && onScan(qrData);
      qrData = null;
    }, delay);

    const tick = () => {
      if (canvas) {
        try {
          const { videoWidth, videoHeight } = video;
          const videoRatio = videoWidth / videoHeight;
          const width =
            window.innerHeight <= root.clientHeight
              ? window.innerHeight * videoRatio
              : root.clientHeight * videoRatio;
          const height =
            window.innerHeight <= root.clientHeight
              ? window.innerHeight
              : root.clientHeight;

          const videoQrArea = videoWidth / 1.8;
          const canvasQrArea = width / 1.8;

          const correctedX = (width - canvasQrArea) / 2;
          const correctedY = (height - canvasQrArea) / 2;

          const drawLine = (begin, end, color) => {
            ctx.beginPath();
            ctx.moveTo(begin.x + correctedX, begin.y + correctedY);
            ctx.lineTo(end.x + correctedX, end.y + correctedY);
            ctx.setLineDash([0]);
            ctx.lineWidth = 3;
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.closePath();
          };

          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.clearRect(correctedX, correctedY, canvasQrArea, canvasQrArea);
            ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.setLineDash([4]);
            ctx.strokeStyle = "#00897b";
            ctx.lineWidth = 6;

            ctx.drawImage(
              video,
              (videoWidth - videoQrArea) / 2,
              (videoHeight - videoQrArea) / 2,
              videoQrArea,
              videoQrArea,
              correctedX,
              correctedY,
              canvasQrArea,
              canvasQrArea
            );
            ctx.strokeRect(correctedX, correctedY, canvasQrArea, canvasQrArea);

            const imageData = ctx.getImageData(
              correctedX,
              correctedY,
              canvasQrArea,
              canvasQrArea
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
            "QrCamera Component??? ???????????? ?????????,\n ?????? ?????? Component??? ????????? ????????? ??????????????????."
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
