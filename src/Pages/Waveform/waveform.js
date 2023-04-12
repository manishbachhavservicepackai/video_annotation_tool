import "./waveform.scss"
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import conversation from "../../assets/audios/sample-6s.mp3";

import RegionsPlugin from "wavesurfer.js/src/plugin/regions";
import CursorPlugin from "wavesurfer.js/dist/plugin/wavesurfer.cursor";

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import IosShareIcon from '@mui/icons-material/IosShare';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Button } from "@mui/material";
import client from "../../api/client";
import { Store } from "react-notifications-component";
import 'react-notifications-component/dist/theme.css';
import 'animate.css';

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
    const [speed, setSpeed] = useState('');

    const handleSpeedChange = (event) => {
        setSpeed(event.target.value);
        waveSurferRef.current.setPlaybackRate(event.target.value)
    };

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

        waveSurfer.addRegion({
            id: "my_id",
            start: 0,
            end: 0.5000,
            color: 'hsla(152, 73%, 84%, 0.5)'
        })

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
            if (res.data.content.error === false) {
                Store.addNotification({
                    title: 'Success',
                    message: 'Files were synced',
                    type: 'success',                         // 'default', 'success', 'info', 'warning'
                    container: 'top-right',                // where to position the notifications
                    animationIn: ["animated", "fadeIn"],     // animate.css classes that's applied
                    animationOut: ["animated", "fadeOut"],   // animate.css classes that's applied
                    dismiss: {
                        duration: 2000
                    }
                })
            }
            else {
                Store.addNotification({
                    title: 'Error',
                    message: 'Something went wrong!',
                    type: 'error',                         // 'default', 'success', 'info', 'warning'
                    container: 'top-right',                // where to position the notifications
                    animationIn: ["animated", "fadeIn"],     // animate.css classes that's applied
                    animationOut: ["animated", "fadeOut"],   // animate.css classes that's applied
                    dismiss: {
                        duration: 2000
                    }
                })
            }
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

                <section
                    className="wave_toggle"
                    style={{
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        paddingTop: "24px",
                        paddingBottom: "24px",
                        paddingInline: "12px",
                        backgroundColor: "#fff",
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

                    <FormControl
                        sx={{
                            width:"200px"
                        }}
                        size="small"
                    >
                        <InputLabel id="demo-simple-select-label">Audio Speed</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={speed}
                            label="Audio Speed"
                            onChange={handleSpeedChange}
                        >
                            <MenuItem value={0.1}>0.3x</MenuItem>
                            <MenuItem value={0.2}>0.2x</MenuItem>
                            <MenuItem value={0.3}>0.1x</MenuItem>
                            <MenuItem value={1}>1x</MenuItem>
                            <MenuItem value={2}>2x</MenuItem>
                            <MenuItem value={3}>3x</MenuItem>
                        </Select>
                    </FormControl>
                    <div
                        className="slider_div"
                        style={{
                            width: "20%",
                        }}
                    >
                        <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
                            <ZoomOutIcon />
                            <Slider
                                aria-label="Zoom"
                                defaultValue={0}
                                valueLabelDisplay="auto"
                                min={0}
                                max={400}
                                onChange={(e) => {
                                    waveSurferRef.current.zoom(e.target.value)
                                }}
                            />
                            <ZoomInIcon />
                        </Stack>

                    </div>
                </section>
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
                            waveSurferRef.current.regions.list["my_id"].play()
                            // toggleIsPlaying(waveSurferRef.current.isPlaying())
                        }
                        }
                        variant="contained"
                        sx={{
                            width: "275px",
                            fontSize: "14px"
                        }}
                        startIcon={< PlayArrowIcon />}
                    >
                        Play Selected Chunck
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
                </div>

            </section>

        </>
    )
};

export default Waveform;