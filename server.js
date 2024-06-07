const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());


const storage = multer.diskStorage({   
    destination: function (req, file, cb) {
      const dir = 'C:/uploads'; 
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); 
    }
  });
  
  const upload = multer({ storage: storage });


  app.post('/upload', upload.single('binaryFile'), (req, res) => {  
    const filePath = req.file.path;
    const uploadDir = path.dirname(filePath);

    const programmerPath = req.body.programmerPath || 'C:\\Program Files\\STMicroelectronics\\STM32Cube\\STM32CubeProgrammer\\bin\\STM32_Programmer_CLI.exe';

    const flashCommand = `"${programmerPath}" ` +
                         `-c port=SWD reset=HWrst ` +
                         `-d "${filePath}" ` +
                         `0x08000000 -v -HardRst`;

    exec(flashCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Flash command failed:', error);
        console.error('Standard error output (stderr):', stdout); // Log standard error output
        res.status(500).send(`Flash command failed: ${stderr}`); // Send stderr in the response
        return;
      }
      console.log('Flash command output:', stdout);
      fs.rmdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
          console.error('Failed to delete the upload directory:', err);
        } else {
          console.log('Upload directory deleted successfully');
        }
      });
      res.send('File uploaded and flashed successfully');
    });
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
