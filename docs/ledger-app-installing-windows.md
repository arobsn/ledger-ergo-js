# Sideloading Ergo Ledger App into a Ledger Nano S device on Windows

To install the [Ergo Ledger App](https://github.com/tesseract-one/ledger-app-ergo) we need [virtualenv](https://docs.python.org/3/library/venv.html), this module provides support for creating lightweight “virtual environments”, optionally isolated from the system.

## Requirements

- Ledger Nano S device
- Windows OS

## Steps

1. Install python3.x if you don’t have it already installed (you may need to restart the computer) from https://www.python.org/downloads/

2. Download and extract the latest Ergo Ledger App binary files from https://github.com/tesseract-one/ledger-app-ergo/actions/runs/2315938025;

3. Using the command prompt, navigate to extracted Ledger App folder;

4. Execute these commands on the terminal to install pip and virtualenv.

   ```
   $ py -m ensurepip –upgrade
   $ pip3 install virtualenv
   ```

5. Execute these commands on the command prompt to run `virtulenv` and activate it:

   ```
   $ python -m venv .\venv
   $ venv\Scripts\activate
   ```

6. Install Ledger Blue:

   ```
   (venv)$ pip install ledgerblue
   ```

7. Connect and unlock your Ledger Nano S device to your computer;

8. Now it's time to deploy the binary file `app.hex` into the Ledger device:

   ```
   (venv)$ python -m ledgerblue.loadApp --targetId 0x31100004 --apdu --tlv --fileName app.hex --appName Ergo --appFlags 0xe0
   ```

While the process is running, follow the instructions on the device screen to validate and accept the app installation.
