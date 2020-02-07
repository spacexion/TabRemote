# TabRemote

TabRemote is a toolkit aimed to give control of loaded tabs in a web browser remotely.

It uses a userscript which send data and receive commands from/to a local Node.js server.

The server hosts a web interface which loads a tab view for each connected userscript.

The web remote can then send commands to corresponding userscript and receive data from it.

The set of files comprised of a userscript and its web view files is called a tab module.

The server hosts also a global system keystroke listener that can be configured to bind keystrokes to tab module commands.

For now there are 2 tab modules:

- Deezer_com
- Youtube_com

### Why ?

You can basically create a customizable web remote for any website loaded on a browser, accessible on your network, and it ships a pre-made module for Deezer and Youtube...

Useful for controlling browser tabs from another device or screen.

### How to use ?

Install a userscript loader extension like TamperMonkey in you web browser and add the available tab modules you need.

Install Node.Js if necessary, download this project, start install.sh or install.bat to install node modules, then start the server (start.sh, start.bat, node app.js)

Go to http://127.0.0.1:3000, you should see the TabRemoteServer page.

Now, for each tab loaded in your browser with a tab module userscript, you should see a corresponding tab and a view under the page header in the TabRemoteServer page.

Enjoy !


### Plus

If your port 3000 is not available, you can change the server port in config.json, but you also need to change it in each userscript you loaded too !

If you need to control tabs of other computers, you can also change the server address in userscript files loaded on the computers browsers.

You can bind keystrokes to tab commands in config.json, you can edit them but restart the server afterward !

Each keystroke binding is defined in 'keyBindings' by 'module_name', as:

`'nameOfCommand': {"ctrl": false, "shift":false, "alt": false, "code": 'keyCode', "target": "first"}`

The 'nameOfCommand' is a the name of the command that will be sent to the first tab of the corresponding module.

The parameters "ctrl", "shift", "alt" are optionals. Target can be 'first', 'last' or 'all', and defines which tab(s) to send the keystroke command.

You can disable the keystroke listener by setting 'keystrokeListener' to false in config.json.

If you use Chrome, disable this chrome://flags :Hardware Media Key Handling

There is a basic password system which is not very secure but it works.

You can change the password section in the server config, restart it and the hashed_password should be field.

If server has hashed_password defined, scripts will need a password, change the password field in the userscripts you use.

The password is also asked on the web client loader page.


### UserScript

Just a tampermonkey userscript specific to a webpage. It parse the data from the tab, executes actions on the tab and synchronize with the server via web sockets.

- load script at page loaded
- connect to ws server
- find items in tab
- set tab data from items (and send to server new data)
- bind listener on items (and update tab data if changed)
- set server commands listeners

### Server

It's a Node.js app which acts as a proxy between the tab userscript and the web client. It hosts the Web Server for the web client and a Web Socket Server for data and commands between client and userscript and also a system key listener which can be bound to a tabmodule command in config.

- load config and check
- load web server instance
- load web socket server
- load tab modules
- load key listener bindings

### Web Interface

It's a view tab panel. One view tab created foreach userscript connected.

- connect to web socket server
- query modules list
- load modules files (view html,css,js)
- query tabs list
- create a view tab foreach tab
- populate view tab with view file
- create instance of view script

## TODO
- put on github