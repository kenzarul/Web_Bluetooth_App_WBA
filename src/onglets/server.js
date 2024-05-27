import express from 'express';
import { json } from 'body-parser';
import { exec } from 'child_process';
const app = express();
const port = 3000;

app.use(json());

app.post('/flash', (req, res) => {
  const { binaryPath, memoryAddress } = req.body;
  const command = `STM32_Programmer_CLI.exe --connect port=SWD -d ${binaryPath} ${memoryAddress}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send(`Error: ${error.message}`);
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return res.status(500).send(`Stderr: ${stderr}`);
    }
    console.log(`Stdout: ${stdout}`);
    res.send(`Success: ${stdout}`);
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});