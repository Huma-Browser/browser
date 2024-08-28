


 
if (!AddonManager) {
    var { AddonManager } = ChromeUtils.importESModule(
      "resource://gre/modules/AddonManager.sys.mjs"
    ); 
  }
  
  var gHumaUIManager = {
    openAndChangeToTab(url, options) {
      if (window.ownerGlobal.parent) {
        let tab = window.ownerGlobal.parent.gBrowser.addTrustedTab(url, options);
        window.ownerGlobal.parent.gBrowser.selectedTab = tab;
        return tab;
      }
      let tab = window.gBrowser.addTrustedTab(url, options);
      window.gBrowser.selectedTab = tab;
      return tab;
    },
  
    generateUuidv4() {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
      );
    },
    
    toogleBookmarksSidebar() {
      const button = document.getElementById('huma-bookmark-button');
      SidebarController.toggle('viewBookmarksSidebar', button);
    },
  
   /* _kip(){
      gHumaBrowserManagerSidebar._kip();
    },
    _bar(){
      gHumaBrowserManagerSidebar._bar();
    }*/
  };
  
  
  var gHumaBrowserManagerSidebar = {
    _sidebarElement: null,
   
    _humaBarElement: null,
    _currentPanel: null,
    _lastOpenedPanel: null,
    _hasChangedConfig: true,
    _splitterElement: null,
    _hSplitterElement: null,
    _hasRegisteredPinnedClickOutside: false,
    _isDragging: false,
    contextTab: null,
  
    DEFAULT_MOBILE_USER_AGENT: "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 Edg/114.0.1823.79",
    MAX_SIDEBAR_PANELS: 8, // +1 for the add panel button
    MAX_RUNS: 3,
  
    init() {
      this.update();
      this.close(); // avoid caching
      this.listenForPrefChanges();
      this.insertIntoContextMenu();
      this.kip();
      //this.populateExtensionsList();
      this._findThemePalette();
    
      
    },
  
  
    get sidebarData() {
      let services = Services.prefs.getStringPref("huma.sidebar.data");
      if (services === "") {
        return {};
      }
      return JSON.parse(services);
    },
  
    get shouldCloseOnBlur() {
      return Services.prefs.getBoolPref("huma.sidebar.close-on-blur");
    },
  
    listenForPrefChanges() {
      Services.prefs.addObserver("huma.sidebar.data", this.handleEvent.bind(this));
      Services.prefs.addObserver("huma.sidebar.enabled", this.handleEvent.bind(this));
  
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      this.splitterElement.addEventListener("mousedown", (function(event) {
        let computedStyle = window.getComputedStyle(sidebar);
        let maxWidth = parseInt(computedStyle.getPropertyValue("max-width").replace("px", ""));
        let minWidth = parseInt(computedStyle.getPropertyValue("min-width").replace("px", ""));
  
        if (!this._isDragging) { // Prevent multiple resizes
          this._isDragging = true;
          let sidebarWidth = sidebar.getBoundingClientRect().width;
          let startX = event.clientX;
          let startWidth = sidebarWidth;
          let mouseMove = (function(e) {
            let newWidth = startWidth + e.clientX - startX;
            if (newWidth <= minWidth+10) {
              newWidth = minWidth+1;
            } else if (newWidth >= maxWidth-10) {
              newWidth = maxWidth-1;
            }
            sidebar.style.width = `${newWidth}px`;
          });
          let mouseUp = (function() {
            this.handleEvent();
            this._isDragging = false;
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("mouseup", mouseUp);
          }).bind(this);
          document.addEventListener("mousemove", mouseMove);
          document.addEventListener("mouseup", mouseUp);
        }
      }).bind(this));
  
      /*this.hSplitterElement.addEventListener("mousedown", (function(event) {
        let computedStyle = window.getComputedStyle(sidebar);
        const parent = sidebar.parentElement;
        // relative to avoid the top margin
        // 20px is the padding
        let parentRelativeHeight = parent.getBoundingClientRect().height - parent.getBoundingClientRect().top + 20;
        let minHeight = parseInt(computedStyle.getPropertyValue("min-height").replace("px", ""));
        if (!this._isDragging) { // Prevent multiple resizes
          this._isDragging = true;
          let sidebarHeight = sidebar.getBoundingClientRect().height;
          let startY = event.clientY;
          let startHeight = sidebarHeight;
          let mouseMove = (function(e) {
            let newHeight = startHeight + e.clientY - startY;
            if (newHeight <= minHeight+10) {
              newHeight = minHeight+1;
            } else if (newHeight >= parentRelativeHeight) { // 10px is the padding
              newHeight = parentRelativeHeight;
            }
            sidebar.style.height = `${newHeight}px`;
          });
          let mouseUp = (function() {
            this.handleEvent();
            this._isDragging = false;
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("mouseup", mouseUp);
          }).bind(this);
          document.addEventListener("mousemove", mouseMove);
          document.addEventListener("mouseup", mouseUp);
        }
      }).bind(this));*/
  
      this.handleEvent();
    },
  
    get isFloating() {
      return document.getElementById("huma-sidebar-web-panel").hasAttribute("pinned");
    },
  
    handleEvent() {
      this._hasChangedConfig = true;
      this.update();
      this._hasChangedConfig = false;
  
      // https://stackoverflow.com/questions/11565471/removing-event-listener-which-was-added-with-bind
      var clickOutsideHandler = this._handleClickOutside.bind(this);
      let isFloating = this.isFloating;
      if (isFloating && !this._hasRegisteredPinnedClickOutside) {
        document.addEventListener("mouseup", clickOutsideHandler);
        this._hasRegisteredPinnedClickOutside = true;
      } else if (!isFloating && this._hasRegisteredPinnedClickOutside) {
        document.removeEventListener("mouseup", clickOutsideHandler);
        this._hasRegisteredPinnedClickOutside = false;
      }
  
      /*const button = document.getElementById("huma-sidepanel-button");
      if (Services.prefs.getBoolPref("huma.sidebar.enabled")) {
        button.removeAttribute("hidden");
      } else {
        button.setAttribute("hidden", "true");
        this._closeSidebarPanel();
        return;
      }*/
    },
  
    _handleClickOutside(event) {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      if (!sidebar.hasAttribute("pinned") || this._isDragging || !this.shouldCloseOnBlur) {
        return;
      }
      let target = event.target;
      const closestSelector = [
        "#huma-sidebar-web-panel",
        "#huma-sidebar-panels-wrapper-container",
        "#humaWebPanelContextMenu",
        "#huma-sidebar-web-panel-splitter",
        "#contentAreaContextMenu"
      ].join(", ");
      if (target.closest(closestSelector)) {
        return;
      }
      this.close();
    },
  
    toggle() {
      if (!this._currentPanel) {
        this._currentPanel = this._lastOpenedPanel;
      } 
      if (document.getElementById("huma-sidebar-web-panel").hasAttribute("hidden")) {
        this.open();
        return;
      }
      this.close();
    },
  
    open() {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      sidebar.removeAttribute("hidden");
      this.update();
    },
  
    update() {
      this._updateWebPanels();
      this._updateSidebarButton();
      this._updateWebPanel();
      this._updateButtons();
    },
  
    _updateSidebarButton() {
      let button = document.getElementById("huma-sidepanel-button");
      if (!document.getElementById("huma-sidebar-web-panel").hasAttribute("hidden")) {
        button.setAttribute("open", "true");
      } else {
        //button.removeAttribute("open");
      }
    },
  
    _updateWebPanels() {
      if (Services.prefs.getBoolPref("huma.sidebar.enabled")) {
        this.sidebarElement.removeAttribute("hidden");
      } else {
        this.sidebarElement.setAttribute("hidden", "true");
        this._closeSidebarPanel();
        return;
      }
  
      let data = this.sidebarData;
      if (!data.data || !data.index) {
        return;
      }
      this.sidebarElement.innerHTML = "";
      for (let site of data.index) {
        let panel = data.data[site];
        if (!panel || !panel.url) {
          continue;
        }
        let button = document.createXULElement("toolbarbutton");
        button.classList.add( "humabar-button"   );
        button.setAttribute("flex", "1");
        button.style.display = "flex"
        button.style.alignItems = "center"
        button.style.justifyContent =" center"
        button.style.width = "50px",
        button.style.height = "50px",
        button.style.minWidth = "50px";
        button.style.minHeight = "50px";
        button.style.maxWidth = "50px";
        button.style.maxHeight = "50px";
        button.setAttribute("huma-sidebar-id", site);
        button.setAttribute("context", "humaWebPanelContextMenu");
        this._getWebPanelIcon(panel.url, button);
        button.addEventListener("click", this._handleClick.bind(this));
        this.sidebarElement.appendChild(button);
      }
      const addButton = document.getElementById("huma-sidebar-add-panel-button");
      if (data.index.length < this.MAX_SIDEBAR_PANELS) {
        addButton.removeAttribute("hidden");
      } else {
        addButton.setAttribute("hidden", "true");
      }
    },
  
    _showPrefsPage() {
      if (Services.prefs.getBoolPref("huma.sidebar.enabled")) {
        this.sidebarElement.removeAttribute("hidden");
      } else {
        this.sidebarElement.setAttribute("hidden", "true");
        this._closeSidebarPanel();
        return;
      }
      let data = this.sidebarData;
      if (!data.data || !data.index) {
        return;
      }
      
      this.sidebarElement.innerHTML = "";
      for (let site of data.index) {
        let panel = data.data[site];
        if (!panel || !panel.url) {
          continue;
        }
        let row = document.createElement("div");
        row.className = "humabar-row";
        
        let urlCell = document.createElement("div");
        urlCell.className = "humabar-cell";
        let urlButton = document.createElement("button");
        urlButton.className = "humabar-buttons";
        urlButton.textContent = panel.url;
        urlButton.setAttribute("huma-sidebar-id", site);
        urlButton.setAttribute("context", "humaWebPanelContextMenu");
        urlButton.addEventListener("click", this._handleClick.bind(this));
        urlCell.appendChild(urlButton);
        
        let actionCell = document.createElement("div");
        actionCell.className = "humabar-cell";
        actionCell.style.flexBasis = "120px";
        actionCell.style.display = "flex";
        actionCell.style.justifyContent = "flex-end";
        
        let upButton = this._createIconButton("\u2191");
        let downButton = this._createIconButton("\u2193");
        let deleteButton = this._createIconButton("Delete");
        
        deleteButton.addEventListener("click", (event) => {
          let idToDelete = event.target.closest(".humabar-row").querySelector("[huma-sidebar-id]").getAttribute("huma-sidebar-id");
          this._deleteUrl(idToDelete);
        });
        
        //actionCell.appendChild(upButton);
        //actionCell.appendChild(downButton);
        actionCell.appendChild(deleteButton);
        
        row.appendChild(urlCell);
        row.appendChild(actionCell);
        
        this.sidebarElement.appendChild(row);
      }
      
      let createButton = document.createElement("button");
      createButton.className = "create-button";
      createButton.textContent = "+ Add new site";
      createButton.addEventListener("click", this._createNewUrl.bind(this));
      this.sidebarElement.appendChild(createButton);
    },
    
    _createIconButton(icon) {
      let button = document.createElement("button");
      button.className = "icon-button";
      button.textContent = icon;
      return button;
    },
    
    _deleteUrl(idToDelete) {
      let currentData = JSON.parse(Services.prefs.getStringPref("huma.sidebar.data"));
      if (currentData.data[idToDelete]) {
        delete currentData.data[idToDelete];
        let index = currentData.index.indexOf(idToDelete);
        if (index > -1) {
          currentData.index.splice(index, 1);
        }
        Services.prefs.setStringPref("huma.sidebar.data", JSON.stringify(currentData));
        this._showPrefsPage();
        this._updateWebPanels();
      }
    },
    
    _createNewUrl() {
      this._openAddPanelDialog();
     //console.log("Create new URL clicked");
    },
  
  
    async _openAddPanelDialog() {
      let dialogURL = "chrome://browser/content/places/humaWebPanel.xhtml";
      let features = "centerscreen,chrome,modal,resizable=no";
      let aParentWindow = Services.wm.getMostRecentWindow("navigator:browser");
  
      if (aParentWindow?.gDialogBox) {
        await aParentWindow.gDialogBox.open(dialogURL, {});
      } else {
        aParentWindow.openDialog(dialogURL, "", features, {});
      }
    },
  
    _setPinnedToElements() {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      sidebar.setAttribute("pinned", "true");
      document.getElementById("huma-sidebar-web-panel-pinned").setAttribute("pinned", "true");
    },
  
    _removePinnedFromElements() {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      sidebar.removeAttribute("pinned");
      document.getElementById("huma-sidebar-web-panel-pinned").removeAttribute("pinned");
    },
  
    _closeSidebarPanel() {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      sidebar.setAttribute("hidden", "true");
  
      let sidebarTwo = document.getElementById("huma-sidebar-web-panel-wrapper");
      sidebarTwo.style.display = "none";
      this._lastOpenedPanel = this._currentPanel;
      this._currentPanel = null;
    },
    _showWeb() {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      let sidebarTwo = document.getElementById("huma-sidebar-web-panel-wrapper");
      sidebar.setAttribute("hidden", "false");
      sidebarTwo.style.display = "flex";
    },
  
    _handleClick(event) {
      let target = event.target;
      let panelId = target.getAttribute("huma-sidebar-id");
      if (this._currentPanel === panelId) {
        return;
      }
      this._showWeb();
      this._currentPanel = panelId;
      this._updateWebPanel();
    },
  
    _createNewPanel(url) {
      let data = this.sidebarData;
      let newName = "p" + new Date().getTime();
      data.index.push(newName);
      data.data[newName] = {
        url: url,
        ua: false,
      };
      Services.prefs.setStringPref("huma.sidebar.data", JSON.stringify(data));
      this._currentPanel = newName;
      this.open();
    },
  
    _updateButtons() {
      for (let button of this.sidebarElement.querySelectorAll(".huma-sidebar-panel-button")) {
        if (button.getAttribute("huma-sidebar-id") === this._currentPanel) {
          button.setAttribute("selected", "true");
        } else {
          button.removeAttribute("selected");
        }
      }
    },
  
    _hideAllWebPanels() {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      for (let browser of sidebar.querySelectorAll("browser[huma-sidebar-id]")) {
        browser.setAttribute("hidden", "true");
        browser.docShellIsActive = false;
      }
    },
  
    get introductionPanel() {
      return document.getElementById("huma-sidebar-introduction-panel");
    },
  
    _updateWebPanel() {
      this._updateButtons();
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      this._hideAllWebPanels();
      if (!this._currentPanel) {
        this.introductionPanel.removeAttribute("hidden");
        return;
      }
      this.introductionPanel.setAttribute("hidden", "true");
      let existantWebview = this._getCurrentBrowser();
      if (existantWebview) {
        existantWebview.docShellIsActive = true;
        existantWebview.removeAttribute("hidden");
        const element = document.getElementById("huma-sidebar-web-panel-title");
        const maxLength = 47;
        const contentTitle = existantWebview.contentTitle;

        if (contentTitle.length > maxLength) {
          element.textContent = contentTitle.substring(0, maxLength) + '...';
        } else {
          element.textContent = contentTitle;
        }

        //document.getElementById("huma-sidebar-web-panel-title").textContent = existantWebview.contentTitle;
        return;
      }
      let data = this._getWebPanelData(this._currentPanel);
      let browser = this._createWebPanelBrowser(data);
      let browserContainers = document.getElementById("huma-sidebar-web-panel-browser-containers");
      browserContainers.appendChild(browser);
      if (data.ua) {
        browser.browsingContext.customUserAgent = this.DEFAULT_MOBILE_USER_AGENT;
      }
      browser.docShellIsActive = true;
    },
  
    _getWebPanelData(id) {
      let data = this.sidebarData;
      let panel = data.data[id];
      if (!panel || !panel.url) {
        return {};
      }
      return {
        id: id,
        ...panel,
      };
    },
  
    _createWebPanelBrowser(data) {
      const titleContainer = document.getElementById("huma-sidebar-web-panel-title");
      titleContainer.textContent = "Loading...";
      let browser = gBrowser.createBrowser({});
      browser.setAttribute("disablefullscreen", "true");
      browser.setAttribute("src", data.url);
      browser.setAttribute("huma-sidebar-id", data.id);
      browser.setAttribute("disableglobalhistory", "true");
      browser.setAttribute("autoscroll", "false");
      browser.setAttribute("autocompletepopup", "PopupAutoComplete");
      browser.setAttribute("contextmenu", "contentAreaContextMenu");
      browser.setAttribute("disablesecurity", "true");
      browser.addEventListener("pagetitlechanged", (function(event) {
        let browser = event.target;
        let title = browser.contentTitle;
        if (!title) {
          return;
        }
        let id = browser.getAttribute("huma-sidebar-id");
        if (id === this._currentPanel) {
          titleContainer.textContent = title;
        }
      }).bind(this));
      return browser;
    },
  
    _getWebPanelIcon(url, element) {
   
    // Stil ozelliklerini uygulama
    
    // Favicon URL'sini alma
    let { preferredURI } = Services.uriFixup.getFixupURIInfo(url);
    image = document.createElement("img");
    image.setAttribute("src", `https://s2.googleusercontent.com/s2/favicons?domain_url=${url}&size=50`)
    element.appendChild(image)
    //element.setAttribute("image", `page-icon:${preferredURI.spec}`);
  
  
    // Favicon'u yukleme
   fetch(`https://s2.googleusercontent.com/s2/favicons?domain_url=${url}&size=50`).then(async response => {
        if (response.ok) {
            let blob = await response.blob();
            let reader = new FileReader();
            reader.onload = function() {
              
              image.setAttribute("src", reader.result);
              image.stlye.width = "50px";
              image.stlye.height = "50px";
              image.style.display = "flex"
              image.style.alignItems = "center"
              image.style.justifyContent = "center";
              image.classList.add("humabar-icon");
            };
            reader.readAsDataURL(blob);
        }
    });
  },
  
    _getBrowserById(id) {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      return sidebar.querySelector(`browser[huma-sidebar-id="${id}"]`);
    },
  
    _getCurrentBrowser() {
      return this._getBrowserById(this._currentPanel);
    },
  
    reload() {
      let browser = this._getCurrentBrowser();
      if (browser) {
        browser.reload();
      }
    },
  
    forward() {
      let browser = this._getCurrentBrowser();
      if (browser) {
        browser.goForward();
      }
    },
  
    back() {
      let browser = this._getCurrentBrowser();
      if (browser) {
        browser.goBack();
      }
    },
  
    home() {
      let browser = this._getCurrentBrowser();
      if (browser) {
        browser.gotoIndex();
      }
    },
  
    openWebPanel(url, title) {
      this._showWeb();
      let browser = this._getCurrentBrowser();
      if (!browser) {
        browser = this._createWebPanelBrowser({ url: url, id: 'temp' });
        let browserContainers = document.getElementById("huma-sidebar-web-panel-browser-containers");
        browserContainers.appendChild(browser);
      } else {
        browser.setAttribute("src", url);
      }
      document.getElementById("huma-sidebar-web-panel-title").textContent = title;
      this.open();
    },
  
    close() {
      this._hideAllWebPanels();
      this._closeSidebarPanel();
      this._updateSidebarButton();
      
    },
  
    togglePinned(elem) {
      let sidebar = document.getElementById("huma-sidebar-web-panel");
      if (sidebar.hasAttribute("pinned")) {
        this._removePinnedFromElements();
      } else {
        this._setPinnedToElements();
      }
      this.update();
    },
  
    get sidebarElement() {
      if (!this._sidebarElement) {
        this._sidebarElement = document.getElementById("huma-sidebar-panels-sites-container");
      }
      return this._sidebarElement;
    },
   
  
    get humaBarElement() {
      if (!this._humaBarElement) {
        this._humaBarElement = document.getElementById("humabar-box");
      }
      return this._humaBarElement;
    },
  
    get splitterElement() {
      if (!this._splitterElement) {
        this._splitterElement = document.getElementById("huma-sidebar-web-panel-splitter");
      }
      return this._splitterElement;
    },
  
    get hSplitterElement() {
      if (!this._hSplitterElement) {
        this._hSplitterElement = document.getElementById("huma-sidebar-web-panel-hsplitter");
      }
      return this._hSplitterElement;
    },
  
    // Context menu
  
    updateContextMenu(aPopupMenu) {
      let panel =
        aPopupMenu.triggerNode &&
        (aPopupMenu.triggerNode || aPopupMenu.triggerNode.closest("toolbarbutton[huma-sidebar-id]"));
      if (!panel) {
        return;
      }
      let id = panel.getAttribute("huma-sidebar-id");
      this.contextTab = id;
      let data = this._getWebPanelData(id);
      let browser = this._getBrowserById(id);
      let isMuted = browser && browser.audioMuted;
      let mutedContextItem = document.getElementById("context_humaToggleMuteWebPanel");
      document.l10n.setAttributes(mutedContextItem, 
        !isMuted ? "huma-web-side-panel-context-mute-panel" : "huma-web-side-panel-context-unmute-panel");
      if (!isMuted) {
        mutedContextItem.setAttribute("muted", "true");
      } else {
        mutedContextItem.removeAttribute("muted");
      }
      document.l10n.setAttributes(document.getElementById("context_humaToogleUAWebPanel"), 
        data.ua ? "huma-web-side-panel-context-disable-ua" : "huma-web-side-panel-context-enable-ua");
      if (!browser) {
        document.getElementById("context_humaUnloadWebPanel").setAttribute("disabled", "true");
      } else {
        document.getElementById("context_humaUnloadWebPanel").removeAttribute("disabled");
      }
    },
  
    contextOpenNewTab() {
      let browser = this._getBrowserById(this.contextTab);
      let data = this.sidebarData;
      let panel = data.data[this.contextTab];
      let url = (browser == null) ? panel.url : browser.currentURI.spec;
      gHumaUIManager.openAndChangeToTab(url);
      this.close();
    },
  
    contextToggleMuteAudio() {
      let browser = this._getBrowserById(this.contextTab);
      if (browser.audioMuted) {
        browser.unmute();
      } else {
        browser.mute();
      }
    },
  
    contextToggleUserAgent() {
      let browser = this._getBrowserById(this.contextTab);
      browser.browsingContext.customUserAgent = browser.browsingContext.customUserAgent ? null : this.DEFAULT_MOBILE_USER_AGENT;
      let data = this.sidebarData;
      data.data[this.contextTab].ua = !data.data[this.contextTab].ua;
      Services.prefs.setStringPref("huma.sidebar.data", JSON.stringify(data));
      browser.reload();
    },
  
    contextDelete() {
      
      let data = this.sidebarData;
      delete data.data[this.contextTab];
      data.index = data.index.filter(id => id !== this.contextTab);
      let browser = this._getBrowserById(this.contextTab);
      if (browser) {
        browser.remove();
      }
      this._currentPanel = null;
      this._lastOpenedPanel = null;
      this.update();
      Services.prefs.setStringPref("huma.sidebar.data", JSON.stringify(data));
     //console.log(JSON.stringify(data));
     //console.log("HELO")
    },
  
    contextUnload() {
      let browser = this._getBrowserById(this.contextTab);
      browser.remove();
      this._closeSidebarPanel();
      this.close();
      this._lastOpenedPanel = null;
    },
  
    insertIntoContextMenu() {
      const sibling = document.getElementById("context-stripOnShareLink");
      const menuitem = document.createXULElement("menuitem");
      menuitem.setAttribute("id", "context-humaAddToWebPanel");
      menuitem.setAttribute("hidden", "true");
      menuitem.setAttribute("oncommand", "gHumaBrowserManagerSidebar.addPanelFromContextMenu();");
      menuitem.setAttribute("data-l10n-id", "huma-web-side-panel-context-add-to-panel");
      sibling.insertAdjacentElement("afterend", menuitem);
    },
  
    addPanelFromContextMenu() {
      const url = gContextMenu.linkURL || gContextMenu.target.ownerDocument.location.href;
      this._createNewPanel(url);
    },

    getExtensionIdFromIconUrl(iconUrl) {
      const matches = iconUrl.match(/moz-extension:\/\/([a-f0-9\-]+)\//);
      return matches ? matches[1] : null;
    },
  
    async getExtensionSidebarUrl(extensionId) {
      try {
        const manifestUrl = `moz-extension://${extensionId}/manifest.json`;
        const response = await fetch(manifestUrl);
        const manifest = await response.json();
        const sidebarUrl = manifest.sidebar_action?.default_panel;
        if (!sidebarUrl) {
          throw new Error("Sidebar URL bulunamadi.");
        }
        return `moz-extension://${extensionId}/${sidebarUrl}`;
      } catch (error) {
        console.error("Manifest dosyasi yuklenirken hata oluştu:", error);
        return null;
      }
    },
  
    async populateExtensionsList() {
      this.init();
      /*console.log("populateExtensionsList fonksiyonu cagrildi");
      let extensionsList = document.getElementById("humabar-extensions-list");

      const extElement = document.createElement("div");
      extElement.textContent = "helo";


      extensionsList.appendChild(extElement);
      if (!extensionsList) {
        console.error("humabar-extensions-list elementi bulunamadi");
        return;
      }
    
      extensionsList.innerHTML = '';
    
      if (typeof window.SidebarController === 'undefined' || typeof window.SidebarController.getExtensions !== 'function') {
        console.error("SidebarController veya getExtensions metodu tanimli degil");
        return;
      }
    
      try {
        const extensions = window.SidebarController.getExtensions();
       //console.log("Alinan uzantilar:", extensions);
    
        if (!Array.isArray(extensions)) {
          console.error("getExtensions bir dizi dondurmedi");
          return;
        }
    
        for (const extension of extensions) {
          const extensionId = this.getExtensionIdFromIconUrl(extension.icon);
          
          if (!extensionId) {
            continue;
          }
    
          const sidebarUrl = await this.getExtensionSidebarUrl(extensionId);
    
          if (!sidebarUrl) {
            continue;
          }
    
          const button = document.createElement("a");
          button.className = "humabar-button";
          button.setAttribute("tooltiptext", extension.tooltiptext);
          button.setAttribute("extensionId", extension.extensionId);
    
          const image = document.createElement("img");
          image.className = "humabar-button-icon";
    
         
          const iconUrl = await this.getIconFromManifest(extensionId);
          //image.setAttribute("src", iconUrl);
          image.setAttribute("alt", extension.tooltiptext);
    
          button.appendChild(image);
    
          button.addEventListener("click", (event) => {
            event.preventDefault();
            try {
              const urlObject = new URL(sidebarUrl);
              
              if (urlObject.protocol === 'http:' || urlObject.protocol === 'https:' || urlObject.protocol === 'moz-extension:') {
                //window.open(sidebarUrl, '_blank', 'noopener,noreferrer');
                this.openWebPanel(sidebarUrl, extension.tooltiptext)
                
              } else {
                console.error("Guvenli olmayan protokol:", urlObject.protocol);
              }
            } catch (error) {
              console.error("Gecersiz URL:", sidebarUrl, error);
            }
          });
    
          extensionsList.appendChild(button);
        }
    
      } catch (error) {
        console.error("Uzantilari alirken hata oluştu:", error);
      }*/
    },
    
   
    async getIconFromManifest(extensionId) {
      try {
        const manifestUrl = `moz-extension://${extensionId}/manifest.json`;
        const response = await fetch(manifestUrl);
        const manifest = await response.json();
        
       
        const iconUrl = manifest.icons && (manifest.icons['48'] || manifest.icons['32'] || manifest.icons['16']);
        
        if (iconUrl) {
          return `moz-extension://${extensionId}/${iconUrl}`;
        }
      } catch (error) {
        console.error("Manifest dosyasi okunamadi:", error);
      }
      
      
      return "chrome://branding/content/about-logo.png";
    },
  
  
  
  
  
  
  
  
  
  
    _openHumaBar() {
      Services.prefs.setStringPref("huma.preference.humabar.mode", "ince");
     this.humaBarElement.style.display = "flex";
     this.humaBarElement.style.width = "48px";
     this.humaBarElement.style.maxWidth = "48px";
     this.humaBarElement.style.minWidth = "48px";
    
    },
  
    _closeHumaBar() {
      const helo = document.createElement("h1");
      helo.textContent = "helo";
      //this.humaBarElement.appendChild(helo);
      Services.prefs.setStringPref("huma.preference.humabar.mode", "kapali");
     this.humaBarElement.style.display = "none";
     
    },
    _minizmizeHumaBar(){
      Services.prefs.setStringPref("huma.preference.humabar.mode", "ince");
     this.humaBarElement.style.display = "flex";
     this.humaBarElement.style.width = "48px";
     this.humaBarElement.style.maxWidth = "48px";
     this.humaBarElement.style.minWidth = "48px";
      
    },
  
    _maximizeHumaBar(){
      Services.prefs.setStringPref("huma.preference.humabar.mode", "kalin");
     this.humaBarElement.style.display = "flex";
     this.humaBarElement.style.width = "64px";
     this.humaBarElement.style.maxWidth = "64px";
     this.humaBarElement.style.minWidth = "64px";
     
    },
  
   
    _createHumabar() {
     
      const humabarRow = document.getElementById('row');
  
    
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const button3 = document.createElement("button");
   
   
          
      button1.textContent = 'switch to wide mode';
      button1.addEventListener("click", () => {
        alert("Restart browser to apply changes");
        
  
        this._maximizeHumaBar();
  
      })
  
      button2.textContent = 'switch to off mode ';
      button2.addEventListener("click", () => {
      alert("Restart browser to apply changes");
      
  
       this._closeHumaBar();
       this.init();
  
  
      })
  
      button3.textContent = 'Switch to Thin Mode';
      button3.addEventListener("click", () => {
        alert("Restart browser to apply changes");
        
  
        this._minizmizeHumaBar();
        
        this.init();
       
  
  
      })
  
   
          
          // ICONS
          //'chrome://browser/skin/sidebars-right.svg',
          //'chrome://browser/skin/eye-hide.svg',
          //'chrome://browser/skin/sidebars-right.svg',
      
      const cell1 = document.createElement('div');
      cell1.className = 'humabar-cell';
      cell1.appendChild(button1);
      humabarRow.appendChild(cell1);
  
      // Create and append second toolbar button
   
      const cell2 = document.createElement('div');
      cell2.className = 'humabar-cell';
      cell2.appendChild(button2);
      humabarRow.appendChild(cell2);
  
    
      const cell3 = document.createElement('div');
      cell3.className = 'humabar-cell';
      cell3.appendChild(button3);
      humabarRow.appendChild(cell3);
  
     
  },
    async _findThemePalette() {
      try {
          // Aktif tema ID
          let currentTheme = Services.prefs.getCharPref("extensions.activeThemeID");
         //console.log("Aktif tema ID'si:", currentTheme);
  
          // Eklenti nesnesi
          let addon = await AddonManager.getAddonByID(currentTheme);
  
          if (addon) {
              // rootURI'den manifest.json dosyasinin tam yolunu oluşturun
             //console.log(addon);
             //console.log(addon.__AddonInternal__);
             //console.log(addon.__AddonInternal__.rootURI);
  
              const manifestPath = addon.__AddonInternal__.rootURI + "manifest.json";
             //console.log("Manifest Path:", manifestPath);
  
              
              let response = await fetch(manifestPath);
              if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
              }
              let manifestContent = await response.json();
             //console.log("Manifest Content:", manifestContent);
              //toolbar: "rgb(20, 20, 25)"
              //toolbar_field: "rgb(32, 32, 35)"
              let themeBgColor = manifestContent.theme.colors.toolbar;
              let themePaneContentColor = manifestContent.theme.colors.toolbar_field;
              const themePalette = {
                "backgroundColor": themeBgColor,
                "pagePaneColor": themePaneContentColor,
              }
             //console.log(themePalette);
              //this.applyPalette(themePalette)
  
              this.humaBarElement.style.backgroundColor = themePalette.backgroundColor;
              const themedSideBar = document.getElementById("huma-sidebar-web-panel-wrapper");
              themedSideBar.style.backgroundColor = themePalette.pagePaneColor;
              const sideBarButtonGroupElement = document.getElementById("web-panel-button-group");
              sideBarButtonGroupElement.style.backgroundColor = themePalette.backgroundColor;
              //this.applyStyles(themePalette);
              
          } else {
              console.error("Tema eklentisi bulunamadi");
          }
      } catch (error) {
          console.error("Hata oluştu:", error);
      }
  },
  
  kip() {
    const mode = Services.prefs.getStringPref("huma.preference.humabar.mode");
    //const humabarBox = document.getElementById('humabar-box');
    switch(mode){
      case 'ince':
        this._minizmizeHumaBar();
        break;
      case 'kalin':
        this._maximizeHumaBar();
        break;
      case 'kapali':
       this._closeHumaBar();
        break;
      default:
        this._minizmizeHumaBar();
        break;
    }
  },
  
  
  };
gHumaBrowserManagerSidebar.populateExtensionsList();