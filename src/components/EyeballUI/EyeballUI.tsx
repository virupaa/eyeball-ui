"use client";
import React, { useState, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Checkbox, FormControlLabel,
  Slider, Tab, Tabs, AppBar, Select, MenuItem,
  FormGroup, FormControl, InputLabel, CircularProgress, RadioGroup, Radio
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ImageIcon from '@mui/icons-material/Image';
import axios from 'axios';
import JSZip from 'jszip';

const EyeballUI: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [foveaRadius, setFoveaRadius] = useState(0);
  const [peripheralConeCells, setPeripheralConeCells] = useState(0);
  const [foveaRodCells, setFoveaRodCells] = useState(0);
  const [isPeripheralBlurEnabled, setPeripheralBlurEnabled] = useState(false);
  const [isGaussianSigmaEnabled, setGaussianSigmaEnabled] = useState(false);
  const [kernelValue, setKernelValue] = useState<string>("(3, 3)");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [foveaType, setFoveaType] = useState("static");
  const [isVerbose, setIsVerbose] = useState(false);
  const [isMultiprocessing, setIsMultiprocessing] = useState(false);
  const [numCores, setNumCores] = useState(7);
  const [inputImageResolution, setInputImageResolution] = useState(260);
  const [peripheralSigma, setPeripheralSigma] = useState(0);
  const [isPeripheralGrayscale, setPeripheralGrayscale] = useState(false);
  const [isRetinalWarp, setRetinalWarp] = useState(false);
  const [foveaX, setFoveaX] = useState(0); // Default X-coordinate
  const [foveaY, setFoveaY] = useState(0); // Default Y-coordinate
  const [peripheralGaussianSigma, setPeripheralGaussianSigma] = useState(0); // Default Sigma



  const folderInputRef = useRef<HTMLInputElement>(null);
  const singleImageInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleLoadFolder = () => {
    folderInputRef.current?.click();
  };

  const handleLoadSingleImage = () => {
    singleImageInputRef.current?.click();
  };

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileArray = Array.from(event.target.files);
      const folderName = fileArray[0]?.webkitRelativePath.split('/')[0];
      setSelectedFolder(folderName);
      const imageUrls = fileArray.map(file => URL.createObjectURL(file));
      setImages(imageUrls);
    }
  };

  const handleSingleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const singleImageUrl = URL.createObjectURL(event.target.files[0]);
      setImages((prevImages) => [...prevImages, singleImageUrl]);
    }
  };

  const handleRunModel = async () => {
    setIsProcessing(true);
    setProcessedImages([]);
  
    const formData = new FormData();
    formData.append("fovea_radius", foveaRadius.toString());
    formData.append("peripheral_cone_cells", peripheralConeCells.toString());
    formData.append("fovea_rod_cells", foveaRodCells.toString());
    formData.append("peripheral_blur_enabled", isPeripheralBlurEnabled.toString());
    formData.append("kernel_value", kernelValue);
    formData.append("fovea_type", foveaType);
    formData.append("verbose", isVerbose.toString());
    formData.append("multiprocessing", isMultiprocessing.toString());
    formData.append("num_cores", numCores.toString());
    formData.append("input_image_resolution", inputImageResolution.toString());
    formData.append("peripheral_sigma", peripheralSigma.toString());
    formData.append("peripheral_grayscale", isPeripheralGrayscale.toString());
    formData.append("retinal_warp", isRetinalWarp.toString());
    formData.append("fovea_x", foveaX.toString());
    formData.append("fovea_y", foveaY.toString());
    formData.append("peripheral_gaussian_sigma", peripheralGaussianSigma.toString());
  
    for (let i = 0; i < images.length; i++) {
      const response = await fetch(images[i]);
      const blob = await response.blob();
      formData.append("file", blob, `image_${i}.png`);
    }
  
    try {
      const response = await fetch("https://eyeballflaskimagefinal-718563300949.us-central1.run.app/process", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const blob = await response.blob();
      const contentType = response.headers.get("content-type");
  
      if (contentType === "application/zip") {
        const zipUrl = URL.createObjectURL(blob);
        const extractedImageUrls = await extractZipImages(zipUrl);
        setProcessedImages(extractedImageUrls);
      } else {
        const imageUrl = URL.createObjectURL(blob);
        setProcessedImages([imageUrl]);
      }
  
      setTab(1);
    } catch (error) {
      console.error("Error processing images:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  

  const extractZipImages = async (zipUrl: string) => {
    const extractedImages: string[] = [];
    const zip = await JSZip.loadAsync(await fetch(zipUrl).then(res => res.blob()));
    for (const filename of Object.keys(zip.files)) {
      if (filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
        const fileBlob = await zip.files[filename].async("blob");
        const fileUrl = URL.createObjectURL(fileBlob);
        extractedImages.push(fileUrl);
      }
    }
    return extractedImages;
  };

  return (
    <Box sx={{ backgroundColor: '#1e1e1e', padding: 2, color: '#00cc7a', minHeight: '100vh', display:'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
     }}>
      <input
        type="file"
        ref={folderInputRef}
        style={{ display: 'none' }}
        onChange={handleFolderChange}
        multiple
        {...({ webkitdirectory: "true" } as any)}
        accept="image/*"
      />
      <input
        type="file"
        ref={singleImageInputRef}
        style={{ display: 'none' }}
        onChange={handleSingleImageChange}
        accept="image/*"
      />

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          {/* <Button variant="outlined" startIcon={<FolderOpenIcon />} onClick={handleLoadFolder} sx={{ mx: 2, color: '#00cc7a', borderColor: '#00cc7a' }}>
            Load Folder
          </Button> */}
          <br></br>
          <Button variant="outlined" startIcon={<ImageIcon />} onClick={handleLoadSingleImage} sx={{ marginRight:"2px", color: '#00cc7a', borderColor: '#00cc7a' }}>
            Load Image
          </Button>
        </Box>
      </Box>

      <Button
        variant="contained"
        onClick={handleRunModel}
        disabled={isProcessing || images.length === 0}
        sx={{
          position: 'absolute',
          top: '115px',
          right: '25px',
          minWidth: 120,
          backgroundColor: isProcessing ? '#444' : '#00cc7a',
          color: '#1e1e1e',
          boxShadow: '0 0 8px #00cc7a',
          '&:hover': { backgroundColor: isProcessing ? '#444' : '#009f5b' }
        }}
      >
        {isProcessing ? "Processing..." : "Run Model"}
      </Button>

      <AppBar position="static" sx={{ backgroundColor: '#1e1e1e', boxShadow: 'none' }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          aria-label="image preview tabs"
          centered
          TabIndicatorProps={{ style: { backgroundColor: '#00cc7a' } }}
        >
          <Tab label="Input Images" sx={{ color: '#ffffff', '&.Mui-selected': { color: '#00cc7a' } }} />
          <Tab label="Processed Images" sx={{ color: '#ffffff', '&.Mui-selected': { color: '#00cc7a' } }} disabled={!processedImages.length} />
        </Tabs>
      </AppBar>

      <Box display="flex" mt={3}>
        <Box flex={3} p={2} borderRight={1} borderColor="#00cc7a">
          <Typography variant="h6" gutterBottom sx={{ color: '#00cc7a' }}>
            {tab === 0 ? "Image Preview" : "Processed Image Preview"}
          </Typography>
          {isProcessing ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress sx={{ color: '#00cc7a' }} />
            </Box>
          ) : (
            <Box display="grid" gridTemplateColumns="repeat(5, minmax(80px, 1fr))" gap="10px">
              {(tab === 0 ? images : processedImages).map((src, index) => (
                <Box
                  key={index}
                  component="img"
                  src={src}
                  alt={`Uploaded ${index}`}
                  sx={{
                    width: '100%',
                    height: '130px',
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #00cc7a'
                  }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box flex={1} p={2}>
          <Typography variant="h6" gutterBottom sx={{ color: '#00cc7a' }}>Model Parameters</Typography>
          <FormGroup>

          <FormControl margin="normal">
            <Typography sx={{ color: '#00cc7a' }}>Input Image Resolution (px)</Typography>
            <TextField
              type="number"
              value={inputImageResolution}
              onChange={(e) => setInputImageResolution(Math.max(1, parseInt(e.target.value) || 1))} // Ensure at least 1
              InputProps={{ style: { color: '#00cc7a' } }}
              sx={{
                "& .MuiOutlinedInput-root fieldset": { borderColor: "#00cc7a" },
                "& .MuiOutlinedInput-root:hover fieldset": { borderColor: "#00cc7a" },
                "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "#00cc7a" },
              }}
            />
          </FormControl>

          <FormControl margin="normal">
            <Typography sx={{ color: '#00cc7a' }}>Fovea Location (x, y)</Typography>
            <Box display="flex" gap={2}>
              <TextField
                type="number"
                label="x"
                value={foveaX}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setFoveaX(value > inputImageResolution ? inputImageResolution : value); // Cap value to resolution
                }}
                InputProps={{ style: { color: '#00cc7a' } }}
                sx={{
                  "& .MuiOutlinedInput-root fieldset": { borderColor: "#00cc7a" },
                  "& .MuiOutlinedInput-root:hover fieldset": { borderColor: "#00cc7a" },
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "#00cc7a" },
                }}
              />
              <TextField
                type="number"
                label="y"
                value={foveaY}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setFoveaY(value > inputImageResolution ? inputImageResolution : value); // Cap value to resolution
                }}
                InputProps={{ style: { color: '#00cc7a' } }}
                sx={{
                  "& .MuiOutlinedInput-root fieldset": { borderColor: "#00cc7a" },
                  "& .MuiOutlinedInput-root:hover fieldset": { borderColor: "#00cc7a" },
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "#00cc7a" },
                }}
              />
            </Box>
          </FormControl>
           

            <FormControl margin="normal">
              <Typography gutterBottom sx={{ color: '#00cc7a' }}>Fovea Radius: {foveaRadius}</Typography>
              <Slider
                value={foveaRadius}
                min={0}
                max={inputImageResolution}
                onChange={(e, val) => setFoveaRadius(val as number)}
                sx={{ color: '#00cc7a' }}
              />
            </FormControl>

            <FormControl margin="normal">
              <Typography gutterBottom sx={{ color: '#00cc7a' }}>Peripheral Active Cone Cells ({peripheralConeCells}%)</Typography>
              <Slider
                value={peripheralConeCells}
                min={0}
                max={100}
                onChange={(e, val) => setPeripheralConeCells(val as number)}
                sx={{ color: '#00cc7a' }}
              />
            </FormControl>

            <FormControl margin="normal">
              <Typography gutterBottom sx={{ color: '#00cc7a' }}>Fovea Active Rod Cells ({foveaRodCells}%)</Typography>
              <Slider
                value={foveaRodCells}
                min={0}
                max={100}
                onChange={(e, val) => setFoveaRodCells(val as number)}
                sx={{ color: '#00cc7a' }}
              />
            </FormControl>


            <FormControlLabel
              control={
                <Checkbox
                  checked={isPeripheralBlurEnabled}
                  onChange={(e) => setPeripheralBlurEnabled(e.target.checked)}
                  sx={{ color: "#00cc7a" }}
                />
              }
              label="Peripheral Gaussian Blur"
              sx={{ color: "#00cc7a" }}
            />

            {/* Peripheral Gaussian Blur Kernel */}
            <FormControl fullWidth margin="normal">
              <InputLabel shrink style={{ color: "#00cc7a" }}>
                Peripheral Gaussian Blur Kernel
              </InputLabel>
              <Select
                disabled={!isPeripheralBlurEnabled}
                value={kernelValue}
                onChange={(e) => setKernelValue(e.target.value as string)}
                sx={{
                  color: "#00cc7a",
                  ".MuiOutlinedInput-notchedOutline": { borderColor: "#00cc7a" },
                  ".MuiSvgIcon-root": { color: "#00cc7a" },
                }}
              >
                {[3, 5, 7, 9, 11, 21].map((size) => (
                  <MenuItem key={size} value={`(${size}, ${size})`}>
                    {`(${size}, ${size})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Peripheral Gaussian Sigma */}
            <Typography gutterBottom sx={{ color: "#00cc7a" }}>
              Peripheral Gaussian Sigma
            </Typography>
            <TextField
              disabled={!isPeripheralBlurEnabled}
              type="number"
              value={peripheralSigma}
              onChange={(e) => setPeripheralSigma(parseFloat(e.target.value))}
              InputProps={{ style: { color: "#00cc7a" } }}
              sx={{
                "& .MuiOutlinedInput-root fieldset": { borderColor: "#00cc7a" },
                "& .MuiOutlinedInput-root:hover fieldset": { borderColor: "#00cc7a" },
                "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "#00cc7a" },
              }}
            />
          
          <FormControlLabel
            control={<Checkbox checked={isPeripheralGrayscale} onChange={(e) => setPeripheralGrayscale(e.target.checked)} sx={{ color: '#00cc7a' }} />}
            label="Peripheral Grayscale"
          />

              {/* <FormControlLabel
                control={<Checkbox checked={isRetinalWarp} onChange={(e) => setRetinalWarp(e.target.checked)} sx={{ color: '#00cc7a' }} />}
                label="Retinal Warp"
              /> */}


  

            {/* <FormControlLabel control={<Checkbox checked={isVerbose} onChange={(e) => setIsVerbose(e.target.checked)} sx={{ color: '#00cc7a' }} />} label="Verbose" />
            <FormControlLabel control={<Checkbox checked={isMultiprocessing} onChange={(e) => setIsMultiprocessing(e.target.checked)} sx={{ color: '#00cc7a' }} />} label="Multiprocessing" /> */}

            

            {/* <FormControl component="fieldset" margin="normal">
              <Typography sx={{ color: '#00cc7a' }}>Fovea Type</Typography>
              <RadioGroup row value={foveaType} onChange={(e) => setFoveaType(e.target.value)}>
                <FormControlLabel value="static" control={<Radio sx={{ color: '#00cc7a' }} />} label="Static" />
                <FormControlLabel value="dynamic" control={<Radio sx={{ color: '#00cc7a' }} />} label="Dynamic" />
              </RadioGroup>
            </FormControl> */}

            {/* <FormControl fullWidth margin="normal">
              <InputLabel shrink style={{ color: '#00cc7a' }}>Number of Cores</InputLabel>
              <Select
                value={numCores}
                onChange={(e) => setNumCores(parseInt(e.target.value as string))}
                sx={{
                  color: '#00cc7a',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: '#00cc7a' },
                  '.MuiSvgIcon-root': { color: '#00cc7a' }
                }}
              >
                {[1, 2, 4, 7].map(core => (
                  <MenuItem key={core} value={core}>{core}</MenuItem>
                ))}
              </Select>
            </FormControl> */}
          </FormGroup>
        </Box>
      </Box>
    </Box>
  );
};

export default EyeballUI;
