import "./waveform.scss"
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import conversation from "../../assets/audios/sample-6s.mp3";

import RegionsPlugin from "wavesurfer.js/src/plugin/regions";
import CursorPlugin from "wavesurfer.js/dist/plugin/wavesurfer.cursor";

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import IosShareIcon from '@mui/icons-material/IosShare';
import TextField from '@mui/material/TextField';
import { Button } from "@mui/material";
import client from "../../api/client";

const Waveform = () => {

    const containerRef = useRef();
    const waveSurferRef = useRef({
        isPlaying: () => false
    });

    const [isPlaying, toggleIsPlaying] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0.5);
    const [file, setFile] = useState(null);
    const [dataFromUpload, setDataFromUpload] = useState({});
    const [agentName, setAgentName] = useState("");
    const [notify, setNotify] = useState("")

    const uploadFileApi = async () => {
        await client({
            url: "/uploadfile/",
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data"
            },
            data: {
                file: file
            }
        }).then((res) => {
            setDataFromUpload(res.data?.content)
        })
    }

    useEffect(() => {
        const waveSurfer = WaveSurfer.create({
            container: containerRef.current,
            barWidth: 3,
            barRadius: 3,
            barGap: 2,
            barMinHeight: 1,
            cursorWidth: 1,
            height: 225,
            responsive: true,
            waveColor: "#006d75",
            progressColor: "#3f51b5",
            cursorColor: "#3f51b5",
            scrollParent: true,
            plugins: [
                RegionsPlugin.create({}),
                CursorPlugin.create({
                    showTime: false,
                    opacity: 1,
                    customShowTimeStyle: {
                        "background-color": "#004", // can't use alpha channel rgba(0, 0, 4, 0.2) as the text doesn't get complely cleared
                        color: "#ffa",
                        padding: "2px",
                        "font-size": "12px",
                    },
                })
            ]
        })
        if (file) {
            var reader = new FileReader();
            reader.onload = function (evt) {
                // Create a Blob providing as first argument a typed array with the file buffer
                var blob = new window.Blob([new Uint8Array(evt.target.result)]);

                // Load the blob into Wavesurfer
                // wavesurfer.loadBlob(blob);
                // waveSurfer.load(file)
                waveSurfer.loadBlob(blob);
            };
            reader.onerror = function (evt) {
                console.error("An error ocurred reading the file: ", evt);
            };
            // Read File as an ArrayBuffer
            reader.readAsArrayBuffer(file);
        }

        uploadFileApi();
        waveSurfer.on("ready", () => {
            waveSurferRef.current = waveSurfer;
        })

        console.log(waveSurfer.addRegion({
            start: 0,
            end: 0.5000,
            color: 'hsla(152, 73%, 84%, 0.5)'
        }))

        waveSurfer.on("region-updated", function (region) {
            setStartTime((region.start)?.toFixed(4));
            setEndTime((region.end)?.toFixed(4))
        })

        return () => {
            waveSurfer.destroy()
        }
    }, [file]);

    const onFileChange = async (e) => {
        setFile(e.target.files[0]);
    }

    const handleSubmit = async () => {
        await client({
            url: "trimmer/",
            method: "POST",
            data: {
                name: dataFromUpload?.filename,
                agent_name: agentName?.agent_name,
                path: dataFromUpload?.path,
                start_time: Number(startTime),
                end_time: Number(endTime)
            }
        }).then((res) => {
            console.log("res from submit", res.data)
        })
    }
    // console.log("start time", startTime);
    // console.log("endTime", endTime);

    return (
        <>
            <section
                style={{
                    paddingTop: "16px",
                    paddingInline: "16px",
                    backgroundColor: "#e6fffb",
                    height: "100vh"
                }}
            >
                <div
                    className="user_info_div"
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingInline: "12px",
                        paddingBottom: "12px",
                    }}
                >
                    <div
                        className="audio_div"
                        style={{
                            marginInline: "12px",
                            display: "flex",
                            width: "70%"
                        }}
                    >
                        <label for="file-upload" className="custom-file-upload">
                            Click here to choose
                            <input id="file-upload" type="file" onChange={onFileChange} />
                        </label>
                    </div>


                    <TextField
                        id="outlined-basic"
                        label="Enter your name"
                        variant="outlined"
                        size="small"
                        onChange={(e) => setAgentName({ ...agentName, agent_name: e.target.value })}
                    />
                </div>
                <div
                    ref={containerRef}
                    style={{
                        paddingTop: "16px",
                        paddingBottom: "16px",
                        backgroundColor: "#fff",
                    }}
                >
                </div>

                <div
                    className="toggling_div"
                    style={{
                        display: "flex",
                        justifyContent: "space-around",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        backgroundColor: "#fff"
                    }}
                >
                    <Button
                        onClick={() => {
                            waveSurferRef.current.playPause()
                            toggleIsPlaying(waveSurferRef.current.isPlaying())
                        }
                        }
                        variant="contained"
                        sx={{
                            width: "200px",
                            fontSize: "14px"
                        }}
                        startIcon={isPlaying ? <PauseIcon /> : < PlayArrowIcon />}
                    >
                        {isPlaying ? "Pause Full Audio" : "Play Full Audio"}
                    </Button>
                </div>

                <div
                    className="submit_div"
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: "32px",
                        paddingBottom: "32px",
                        backgroundColor: "#fff"
                    }}
                >
                    <Button
                        variant="contained"
                        sx={{
                            width: "20%",
                            backgroundColor: "#00474f",
                            "&:hover": {
                                backgroundColor: "#006d75"
                            }
                        }}
                        startIcon={<IosShareIcon />}
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>

                    <div /* style={{ display: displayErr }} */>{/* {notify} */}</div>
                </div>

            </section>

        </>
    )
};

export default Waveform;