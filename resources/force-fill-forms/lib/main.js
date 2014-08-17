const {Cc, Ci, Cu} = require('chrome');
const lm = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
const wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

var { Hotkey } = require("hotkeys");

var showHotKey = Hotkey({
    combo: "alt-z",
    onPress: function() {
        fillDoc(wm.getMostRecentWindow('navigator:browser').gBrowser.contentWindow);
    }
});



function fillDoc(win) {
    var frames = win.frames;
    
    var doc = win.document;
    var forms = doc.forms;
    if (!forms || forms.length == 0) return;
	Cu.reportError("_fillDocument processing " + forms.length + " forms on " + doc.documentURI);
	for (var i = 0; i < forms.length; i++) {
		var form = forms[i];
		Cu.reportError("_fillDocument processing form[" + i + "]");
        var filled = lm.fillForm(form);
		Cu.reportError('form ' + i + ': ' + filled);
        if (filled) {
            doc.defaultView.alert('filled');
        }
	} // foreach form
    
    if (frames.length > 0) {
        Cu.reportError("_fillDocument processing " + frames.length + " frames on " + win.document.documentURI);
        for (var h=0; h<frames.length; h++) {
            var doc = frames[h].document;
            var forms = doc.forms;
            if (!forms || forms.length == 0) return;
            Cu.reportError("_fillDocument processing " + forms.length + " forms on " + doc.documentURI);
            for (var i = 0; i < forms.length; i++) {
        		var form = forms[i];
        		Cu.reportError("_fillDocument processing form[" + i + "]");
                var filled = lm.fillForm(form);
        		Cu.reportError('form ' + i + ': ' + filled);
                if (filled) {
                    doc.defaultView.alert('filled');
                }
        	} // foreach form
        }
    }

}

//start - add context menus to all windows
var cDump = function(obj) {
    var bstr = 'bstr:\n';
    var fstr = '';
    for (var b in obj) {
        try{
            bstr += b+'='+obj[b]+'\n';
        } catch (e) {
                fstr = b+'='+e+'\n';
        }
    }
    Cu.reportError(bstr);
    if (fstr != '') { Cu.reportError(fstr) }
};

function oncontextmenu(e) {
    //Cu.reportError('contxt reqd on:' + e.target.nodeName);
    //cDump(e);
    //cDump(e.target);
    var node = e.target;
    //e.view.alert(''); e,vuew == window of node
    var eWin = e.view;
    var eDoc = eWin.document;
    var win, doc, domWin, domDoc;
    if (eDoc instanceof Ci.nsIDOMHTMLDocument) {
        domDoc = eDoc;
        domWin = eWin;
        win = wm.getMostRecentWindow("navigator:browser").gBrowser.getBrowserForDocument(eDoc).ownerDocument.defaultView; // domWin.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShellTreeItem).treeOwner.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIXULWindow); //
        doc = win.document;
    } else {
        return; //if its not htmldocument then return
        win = eWin;
        doc = eDoc;
        domWin = eWin.gBrowser.contentWindow;
        domDoc = domWin.document;
    }

    if (node.nodeName == 'INPUT' && node.hasAttribute('type') && (node.getAttribute('type').toUpperCase() == 'PASSWORD' || node.getAttribute('type').toUpperCase() == 'TEXT')){
        //win.alert('asd');
        //domWin.alert('asdf');
        doc.getElementById(MenuItems['0'].id).hidden = false;
    }
}

var MenuItems = {
    0: {
        label: 'Create New Login Info',
        accesskey: null,
        id: 'createLoginInfo',
        command: function() {
            
        }
    },
    1: {
        label: 'Edit Login Info',
        accesskey: null,
        id: 'createLoginInfo',
        command: function() {
            
        }        
    }
}

/**
 * Load our UI into a given window
 */
function loadIntoWindow(window) {
  if (!window)
    return;
    
    //DO YOUR STUFF TO THE WINDOW HERE
    var contextMenu = window.document.getElementById('contentAreaContextMenu');
	if (contextMenu) {
        window.addEventListener('contextmenu', oncontextmenu, false);
        var menuItem;
        for (var menu in MenuItems) {
            menuItem = window.document.createElement('menuitem');
            menuItem.setAttribute('label', MenuItems[menu].label);
            if (MenuItems[menu].accesskey) {
                menuItem.setAttribute('accesskey', MenuItems[menu].accesskey);
            }
            menuItem.addEventListener('command', MenuItems[menu].func, false);
            menuItem.setAttribute('id', MenuItems[menu].id);
            menuItem.hidden = true;
            contextMenu.appendChild(menuItem);
        }
	}
}
 
/**
 * Remove our UI into a given window
 */
function unloadFromWindow(window) {
  if (!window)
    return;
    
    //DO YOUR STUFF TO THE WINDOW HERE\
	var contextMenu = window.document.getElementById('contentAreaContextMenu');
	if (contextMenu) {
        window.removeEventListener('contextmenu', oncontextmenu, false);
        var menuItem;
        for (var menu in MenuItems) {
            menuItem = window.document.getElementById(MenuItems[menu].id);
            contextMenu.removeChild(menuItem);
        }
	}
}

var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function() {
      domWindow.removeEventListener("load", arguments.callee, false);
      loadIntoWindow(domWindow);
    }, false);
  },
   
  onCloseWindow: function(aWindow) {
  },
   
  onWindowTitleChange: function(aWindow, aTitle) {
  }
};

exports.main = function(options, callbacks) {
  // Load into any existing windows
  let windows = wm.getEnumerator("navigator:browser"); //THIS GETS ALL BROWSER TYPE WINDOWS ()MEANING IT HAS GBROWSER)
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }
 
  // Load into any new windows
  wm.addListener(windowListener);
};

exports.onUnload = function (reason) {

  // Stop listening for new windows
  wm.removeListener(windowListener);
 
  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

//end - add context menus to all windows