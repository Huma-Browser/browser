
var HumaWorkspaces = {
    async init() {
      let docElement = document.documentElement;
      if (docElement.getAttribute("chromehidden").includes("toolbar")
        || docElement.getAttribute("chromehidden").includes("menubar")
        || docElement.hasAttribute("privatebrowsingmode")) {
        console.warn("HumaWorkspaces: !!! HumaWorkspaces is disabled in hidden windows !!!");
        return; // We are in a hidden window, don't initialize HumaWorkspaces
      } 
      console.info("HumaWorkspaces: Initializing HumaWorkspaces...");
      window.SessionStore.promiseInitialized.then(async () => {
        await this.initializeWorkspaces();
        console.info("HumaWorkspaces: HumaWorkspaces initialized");
      })
    },
  
    get workspaceEnabled() {
      return Services.prefs.getBoolPref("huma.workspaces", false);
    },
  
    // Wrorkspaces saving/loading
    get _storeFile() {
      return PathUtils.join(
        PathUtils.profileDir,
        "huma-workspaces",
        "Workspaces.json",
      );
    },
  
    async _workspaces() {
      if (!this._workspaceCache) {
        this._workspaceCache = await IOUtils.readJSON(this._storeFile);
        if (!this._workspaceCache.workspaces) {
          this._workspaceCache.workspaces = [];
        }
      }
      return this._workspaceCache;
    },
  
    onWorkspacesEnabledChanged() {
      if (this.workspaceEnabled) {
        this.initializeWorkspaces();
      } else {
        this._workspaceCache = null;
        document.getElementById("huma-workspaces-button")?.remove();
        for (let tab of gBrowser.tabs) {
          gBrowser.showTab(tab);
        }
      }
    },
  
    async initializeWorkspaces() {
      Services.prefs.addObserver("huma.workspaces", this.onWorkspacesEnabledChanged.bind(this));
      this.initializeWorkspacesButton();
      let file = new FileUtils.File(this._storeFile);
      if (!file.exists()) {
        await IOUtils.writeJSON(this._storeFile, {});
      }
      if (this.workspaceEnabled) {
        window.addEventListener("TabClose", this.handleTabClose.bind(this));
        let workspaces = await this._workspaces();
        if (workspaces.workspaces.length === 0) {
          await this.createAndSaveWorkspace("Default Workspace", true);
        } else {
          let activeWorkspace = workspaces.workspaces.find(workspace => workspace.default);
          if (!activeWorkspace) {
            activeWorkspace = workspaces.workspaces.find(workspace => workspace.used);
            activeWorkspace.used = true;
            await this.saveWorkspaces();
          }
          if (!activeWorkspace) {
            activeWorkspace = workspaces.workspaces[0];
            activeWorkspace.used = true;
            await this.saveWorkspaces();
          }
          this.changeWorkspace(activeWorkspace, true);
        }
        this._initializeWorkspaceCreationIcons();
        this._initializeWorkspaceEditIcons();
        this._initializeWorkspaceTabContextMenus();
      }
    },
  
    handleTabClose(event) {
      if (this.__contextIsDelete) {
        return; // Bug when closing tabs from the context menu
      }
      let tab = event.target;
      let workspaceID = tab.getAttribute("huma-workspace-id");
      // If the tab is the last one in the workspace, create a new tab
      if (workspaceID) {
        let tabs = gBrowser.tabs.filter(tab => tab.getAttribute("huma-workspace-id") === workspaceID);
        if (tabs.length === 1) {
          this._createNewTabForWorkspace({ uuid: workspaceID });
          // We still need to close other tabs in the workspace
          this.changeWorkspace({ uuid: workspaceID });
        }
      }
    },
  
    _kIcons: ["🏠", "📄", "💹", "💼", "📧", "✅", "👥"],
  
    _initializeWorkspaceCreationIcons() {
      let container = document.getElementById("PanelUI-huma-workspaces-create-icons-container");
      for (let icon of this._kIcons) {
        let button = document.createXULElement("toolbarbutton");
        button.className = "toolbarbutton-1";
        button.setAttribute("label", icon);
        button.onclick = ((event) => {
          let wasSelected = button.hasAttribute("selected");
          for (let button of container.children) {
            button.removeAttribute("selected");
          }
          if (!wasSelected) {
            button.setAttribute("selected", "true");
          }
        }).bind(this, button);
        container.appendChild(button);
      }
    },
  
    _initializeWorkspaceEditIcons() {
      let container = this._workspaceEditIconsContainer;
      for (let icon of this._kIcons) {
        let button = document.createXULElement("toolbarbutton");
        button.className = "toolbarbutton-1";
        button.setAttribute("label", icon);
        button.onclick = ((event) => {
          let wasSelected = button.hasAttribute("selected");
          for (let button of container.children) {
              button.removeAttribute("selected");
          }
          if (!wasSelected) {
            button.setAttribute("selected", "true");
          }
          this.onWorkspaceEditChange();
        }).bind(this, button);
        container.appendChild(button);
      }
    },
  
    async saveWorkspace(workspaceData) {
      let json = await IOUtils.readJSON(this._storeFile);
      if (typeof json.workspaces === "undefined") {
        json.workspaces = [];
      }
      let existing = json.workspaces.findIndex(workspace => workspace.uuid === workspaceData.uuid);
      if (existing >= 0) {
        json.workspaces[existing] = workspaceData;
      } else {
        json.workspaces.push(workspaceData);
      }
      console.info("HumaWorkspaces: Saving workspace", workspaceData);
      await IOUtils.writeJSON(this._storeFile, json);
      this._workspaceCache = null;
    },
  
    async removeWorkspace(windowID) {
      let json = await this._workspaces();
      console.info("HumaWorkspaces: Removing workspace", windowID);
      await this.changeWorkspace(json.workspaces.find(workspace => workspace.uuid !== windowID));
      this._deleteAllTabsInWorkspace(windowID);
      json.workspaces = json.workspaces.filter(workspace => workspace.uuid !== windowID);
      await this.unsafeSaveWorkspaces(json);
      await this._propagateWorkspaceData();
    },
  
    async saveWorkspaces() {
      await IOUtils.writeJSON(this._storeFile, await this._workspaces());
      this._workspaceCache = null;
    },
  
    async unsafeSaveWorkspaces(workspaces) {
      await IOUtils.writeJSON(this._storeFile, workspaces);
      this._workspaceCache = workspaces;
    },
  
    // Workspaces dialog UI management
  
    openSaveDialog() {
      let parentPanel = document.getElementById("PanelUI-huma-workspaces-multiview");
      PanelUI.showSubView("PanelUI-huma-workspaces-create", parentPanel);
    },
  
    async openEditDialog(workspaceUuid) {
      this._workspaceEditDialog.setAttribute("data-workspace-uuid", workspaceUuid);
      document.getElementById("PanelUI-huma-workspaces-edit-save").setAttribute("disabled", "true");
      let workspaces = (await this._workspaces()).workspaces;
      let workspaceData = workspaces.find(workspace => workspace.uuid === workspaceUuid);
      this._workspaceEditInput.textContent = workspaceData.name;
      this._workspaceEditInput.value = workspaceData.name;
      this._workspaceEditInput.setAttribute("data-initial-value", workspaceData.name);
      this._workspaceEditIconsContainer
        .setAttribute("data-initial-value", workspaceData.icon);
      document.querySelectorAll("#PanelUI-huma-workspaces-edit-icons-container toolbarbutton")
        .forEach(button => {
          if (button.label === workspaceData.icon) {
            button.setAttribute("selected", "true");
          } else {
            button.removeAttribute("selected");
          }
        });
      let parentPanel = document.getElementById("PanelUI-huma-workspaces-multiview");
      PanelUI.showSubView("PanelUI-huma-workspaces-edit", parentPanel);
    },
  
    closeWorkspacesSubView() {
      let parentPanel = document.getElementById("PanelUI-huma-workspaces-multiview");
      parentPanel.goBack();
    },
  
    workspaceHasIcon(workspace) {
      return typeof workspace.icon !== "undefined" && workspace.icon !== "";
    },
  
    getWorkspaceIcon(workspace) {
      if (this.workspaceHasIcon(workspace)) {
        return workspace.icon;
      }
      return workspace.name[0].toUpperCase();
    },
  
    async _propagateWorkspaceData() {
      let currentContainer = document.getElementById("PanelUI-huma-workspaces-current-info");
      let workspaceList = document.getElementById("PanelUI-huma-workspaces-list");
      const createWorkspaceElement = (workspace) => {
        let element = document.createXULElement("toolbarbutton");
        element.className = "subviewbutton";
        element.setAttribute("tooltiptext", workspace.name);
        element.setAttribute("huma-workspace-id", workspace.uuid);
        //element.setAttribute("context", "humaWorkspaceActionsMenu");
        let childs = window.MozXULElement.parseXULToFragment(`
          <div class="huma-workspace-icon">
          </div>
          <div class="huma-workspace-name">
          </div>
          <toolbarbutton closemenu="none" class="toolbarbutton-1 huma-workspace-actions">
            <image class="toolbarbutton-icon" id="huma-workspace-actions-menu-icon"></image>
          </toolbarbutton>
        `);
        
        // use text content instead of innerHTML to avoid XSS
        childs.querySelector(".huma-workspace-icon").textContent = this.getWorkspaceIcon(workspace);
        childs.querySelector(".huma-workspace-name").textContent = workspace.name;
  
        childs.querySelector(".huma-workspace-actions").addEventListener("command", (event) => {
          let button = event.target;
          this._contextMenuId = button.closest("toolbarbutton[huma-workspace-id]").getAttribute("huma-workspace-id");
          const popup = button.ownerDocument.getElementById(
            "humaWorkspaceActionsMenu"
          );
          popup.openPopup(button, "after_end");
        });
        element.appendChild(childs);
        element.onclick = (async () => {
          if (event.target.closest(".huma-workspace-actions")) {
            return; // Ignore clicks on the actions button
          }
          await this.changeWorkspace(workspace)
          let panel = document.getElementById("PanelUI-huma-workspaces");
          PanelMultiView.hidePopup(panel);
          document.getElementById("huma-workspaces-button").removeAttribute("open");
        }).bind(this, workspace);
        return element;
      }
      let workspaces = await this._workspaces();
      let activeWorkspace = workspaces.workspaces.find(workspace => workspace.used);
      currentContainer.innerHTML = "";
      workspaceList.innerHTML = "";
      workspaceList.parentNode.style.display = "flex";
      if (workspaces.workspaces.length - 1 <= 0) {
        workspaceList.innerHTML = "No workspaces available";
        workspaceList.setAttribute("empty", "true");
      } else {
        workspaceList.removeAttribute("empty");
      }
      if (activeWorkspace) {
        let currentWorkspace = createWorkspaceElement(activeWorkspace);
        currentContainer.appendChild(currentWorkspace);
      }
      for (let workspace of workspaces.workspaces) {
        if (workspace.used) {
          continue;
        }
        let workspaceElement = createWorkspaceElement(workspace);
        workspaceList.appendChild(workspaceElement);
      }
    },
  
    async openWorkspacesDialog(event) {
      if (!this.workspaceEnabled) {
        return;
      }
      let target = event.target;
      let panel = document.getElementById("PanelUI-huma-workspaces");
      await this._propagateWorkspaceData();
      PanelMultiView.openPopup(panel, target, {
        position: "bottomright topright",
        triggerEvent: event,
      }).catch(console.error);
    },
  
 

    initializeWorkspacesButton() {
        if (!this.workspaceEnabled) {
          return;
        } else if (document.getElementById("huma-workspaces-button")) {
          let button = document.getElementById("huma-workspaces-button");
          button.removeAttribute("hidden");
          return;
        }
        let browserTabs = document.getElementById("newtab-button-container");
        let button = document.createElement("toolbarbutton");
        button.id = "huma-workspaces-button";
        button.className = "toolbarbutton-1 chromeclass-toolbar-additional";
        button.setAttribute("label", "Workspaces");
        button.setAttribute("tooltiptext", "Workspaces");
        button.onclick = this.openWorkspacesDialog.bind(this);
        browserTabs.insertAdjacentElement("beforebegin", button);
     

      },
  
    async _updateWorkspacesButton() {
      let button = document.getElementById("huma-workspaces-button");
      if (!button) {
        return;
      }
       

      let activeWorkspace = (await this._workspaces()).workspaces.find(workspace => workspace.used);
      if (activeWorkspace) {
        button.innerHTML = `
          <div class="huma-workspace-sidebar-icon">
          </div>
          <div class="huma-workspace-sidebar-name">
          </div>
        `;
  
        // use text content instead of innerHTML to avoid XSS
        button.querySelector(".huma-workspace-sidebar-name").textContent = activeWorkspace.name;
        button.querySelector(".huma-workspace-sidebar-icon").textContent = this.getWorkspaceIcon(activeWorkspace);
  
        if (!this.workspaceHasIcon(activeWorkspace)) {
          button.querySelector(".huma-workspace-sidebar-icon").setAttribute("no-icon", "true");
        }
      }
    },
  
    // Workspaces management
  
    get _workspaceCreateInput() {
      return document.getElementById("PanelUI-huma-workspaces-create-input");
    },
  
    get _workspaceEditDialog() {
      return document.getElementById("PanelUI-huma-workspaces-edit");
    },
  
    get _workspaceEditInput() {
      return document.getElementById("PanelUI-huma-workspaces-edit-input");
    },
  
    get _workspaceEditIconsContainer() {
      return document.getElementById("PanelUI-huma-workspaces-edit-icons-container");
    },
  
    _deleteAllTabsInWorkspace(workspaceID) {
      for (let tab of gBrowser.tabs) {
        if (tab.getAttribute("huma-workspace-id") === workspaceID) {
          gBrowser.removeTab(tab, {
            animate: true,
            skipSessionStore: true,
            closeWindowWithLastTab: false,
          });
        }
      }
    },
  
    _prepareNewWorkspace(window) {
      document.documentElement.setAttribute("huma-workspace-id", window.uuid);
      let tabCount = 0;
      for (let tab of gBrowser.tabs) {
        if (!tab.hasAttribute("huma-workspace-id")) {
          tab.setAttribute("huma-workspace-id", window.uuid);
          tabCount++;
        }
      }
      if (tabCount === 0) {
        this._createNewTabForWorkspace(window);
      }
    },
  
    _createNewTabForWorkspace(window) {
      let tab = gHumaUIManager.openAndChangeToTab(Services.prefs.getStringPref("browser.startup.homepage"));
      tab.setAttribute("huma-workspace-id", window.uuid);
    },
  
    async saveWorkspaceFromCreate() {
      let workspaceName = this._workspaceCreateInput.value;
      if (!workspaceName) {
        return;
      }
      this._workspaceCreateInput.value = "";
      let icon = document.querySelector("#PanelUI-huma-workspaces-create-icons-container [selected]");
      icon?.removeAttribute("selected");
      await this.createAndSaveWorkspace(workspaceName, false, icon?.label);
      document.getElementById("PanelUI-huma-workspaces").hidePopup(true);
    },
  
    async saveWorkspaceFromEdit() {
      let workspaceUuid = this._workspaceEditDialog.getAttribute("data-workspace-uuid");
      let workspaceName = this._workspaceEditInput.value;
      if (!workspaceName) {
        return;
      }
      this._workspaceEditInput.value = "";
      let icon = document.querySelector("#PanelUI-huma-workspaces-edit-icons-container [selected]");
      icon?.removeAttribute("selected");
      let workspaces = (await this._workspaces()).workspaces;
      let workspaceData = workspaces.find(workspace => workspace.uuid === workspaceUuid);
      workspaceData.name = workspaceName;
      workspaceData.icon = icon?.label;
      await this.saveWorkspace(workspaceData);
      await this._updateWorkspacesButton();
      await this._propagateWorkspaceData();
      this.closeWorkspacesSubView();
    },
  
    onWorkspaceCreationNameChange(event) {
      let button = document.getElementById("PanelUI-huma-workspaces-create-save");
      if (this._workspaceCreateInput.value === "") {
        button.setAttribute("disabled", "true");
        return;
      }
      button.removeAttribute("disabled");
    },
  
    onWorkspaceEditChange() {
      let button = document.getElementById("PanelUI-huma-workspaces-edit-save");
      let name = this._workspaceEditInput.value
      let icon = document.querySelector("#PanelUI-huma-workspaces-edit-icons-container [selected]")?.label;
      if ( name === this._workspaceEditInput.getAttribute("data-initial-value")
        && icon === this._workspaceEditIconsContainer.getAttribute("data-initial-value"))
      {
        button.setAttribute("disabled", "true");
        return;
      }
      button.removeAttribute("disabled");
    },
  
    async changeWorkspace(window, onInit = false) {
      if (!this.workspaceEnabled) {
        return;
      }
      let firstTab = undefined;
      let workspaces = await this._workspaces();
      for (let workspace of workspaces.workspaces) {
        workspace.used = workspace.uuid === window.uuid;
      }
      this.unsafeSaveWorkspaces(workspaces);
      console.info("HumaWorkspaces: Changing workspace to", window.uuid);
      for (let tab of gBrowser.tabs) {
        if ((tab.getAttribute("huma-workspace-id") === window.uuid && !tab.pinned) || !tab.hasAttribute("huma-workspace-id")) {
          if (!firstTab) {
            firstTab = tab;
            gBrowser.selectedTab = firstTab;
          }
          gBrowser.showTab(tab);
          if (!tab.hasAttribute("huma-workspace-id")) {
            // We add the id to those tabs that got inserted before we initialize the workspaces
            // example use case: opening a link from an external app
            tab.setAttribute("huma-workspace-id", window.uuid);
          }
        }
      }
      if (typeof firstTab === "undefined" && !onInit) {
        this._createNewTabForWorkspace(window);
      }
      for (let tab of gBrowser.tabs) {
        if (tab.getAttribute("huma-workspace-id") !== window.uuid) {
          gBrowser.hideTab(tab);
        }
      }
      document.documentElement.setAttribute("huma-workspace-id", window.uuid);
      await this.saveWorkspaces();
      await this._updateWorkspacesButton();
      await this._propagateWorkspaceData();
    },
  
    _createWorkspaceData(name, isDefault, icon) {
      let window = {
        uuid: gHumaUIManager.generateUuidv4(),
        default: isDefault,
        used: true,
        icon: icon,
        name: name,
      };
      this._prepareNewWorkspace(window);
      return window;
    },
  
    async createAndSaveWorkspace(name = "New Workspace", isDefault = false, icon = undefined) {
      if (!this.workspaceEnabled) {
        return;
      }
      let workspaceData = this._createWorkspaceData(name, isDefault, icon);
      await this.saveWorkspace(workspaceData);
      await this.changeWorkspace(workspaceData);
    },
  
    async onLocationChange(browser) {
      let tab = gBrowser.getTabForBrowser(browser);
      let workspaceID = tab.getAttribute("huma-workspace-id");
      if (!workspaceID) {
        let workspaces = await this._workspaces();
        let activeWorkspace = workspaces.workspaces.find(workspace => workspace.used);
        if (!activeWorkspace || tab.hasAttribute("hidden")) {
          return;
        }
        tab.setAttribute("huma-workspace-id", activeWorkspace.uuid);
      }
    },
  
    // Context menu management
  
    _contextMenuId: null,
    async updateContextMenu(_) {
      console.assert(this._contextMenuId, "No context menu ID set");
      document.querySelector(`#PanelUI-huma-workspaces [huma-workspace-id="${this._contextMenuId}"] .huma-workspace-actions`).setAttribute("active", "true");
      const workspaces = await this._workspaces();
      let deleteMenuItem = document.getElementById("context_humaDeleteWorkspace");
      if (workspaces.workspaces.length <= 1 || workspaces.workspaces.find(workspace => workspace.uuid === this._contextMenuId).default) {
        deleteMenuItem.setAttribute("disabled", "true");
      } else {
        deleteMenuItem.removeAttribute("disabled");
      }
      let defaultMenuItem = document.getElementById("context_humaSetAsDefaultWorkspace");
      if (workspaces.workspaces.find(workspace => workspace.uuid === this._contextMenuId).default) {
        defaultMenuItem.setAttribute("disabled", "true");
      } else {
        defaultMenuItem.removeAttribute("disabled");
      }
      let openMenuItem = document.getElementById("context_humaOpenWorkspace");
      if (workspaces.workspaces.find(workspace => workspace.uuid === this._contextMenuId).used) {
        openMenuItem.setAttribute("disabled", "true");
      } else {
        openMenuItem.removeAttribute("disabled");
      }
    },
  
    onContextMenuClose() {
      let target = document.querySelector(`#PanelUI-huma-workspaces [huma-workspace-id="${this._contextMenuId}"] .huma-workspace-actions`);
      if (target) {
        target.removeAttribute("active");
      }
      this._contextMenuId = null;
    },
  
    async setDefaultWorkspace() {
      let workspaces = await this._workspaces();
      for (let workspace of workspaces.workspaces) {
        workspace.default = workspace.uuid === this._contextMenuId;
      }
      await this.unsafeSaveWorkspaces(workspaces);
      await this._propagateWorkspaceData();
    },
  
    async openWorkspace() {
      let workspaces = await this._workspaces();
      let workspace = workspaces.workspaces.find(workspace => workspace.uuid === this._contextMenuId);
      await this.changeWorkspace(workspace);
    },
  
    async contextDelete(event) {
      this.__contextIsDelete = true;
      event.stopPropagation();
      await this.removeWorkspace(this._contextMenuId);
      this.__contextIsDelete = false;
    },
  
    async contextEdit(event) {
      event.stopPropagation();
      await this.openEditDialog(this._contextMenuId);
    },
  
    async changeWorkspaceShortcut() {
      // Cycle through workspaces
      let workspaces = await this._workspaces();
      let activeWorkspace = workspaces.workspaces.find(workspace => workspace.used);
      let workspaceIndex = workspaces.workspaces.indexOf(activeWorkspace);
      let nextWorkspace = workspaces.workspaces[workspaceIndex + 1] || workspaces.workspaces[0];
      this.changeWorkspace(nextWorkspace);
    },
  
    _initializeWorkspaceTabContextMenus() {
      const contextMenu = document.getElementById("tabContextMenu");
      const element = window.MozXULElement.parseXULToFragment(`
        <menuseparator/>
        <menu id="context-huma-change-workspace-tab" data-l10n-id="context-huma-change-workspace-tab">
          <menupopup oncommand="HumaWorkspaces.changeTabWorkspace(event.target.getAttribute('huma-workspace-id'))">
          </menupopup>
        </menu>
      `);
      document.getElementById("context_closeDuplicateTabs").after(element);
  
      contextMenu.addEventListener("popupshowing", async (event) => {
        const menu = document.getElementById("context-huma-change-workspace-tab").querySelector("menupopup");
        menu.innerHTML = "";
        const workspaces = await this._workspaces();
        const activeWorkspace = workspaces.workspaces.find(workspace => workspace.used);
        for (let workspace of workspaces.workspaces) {
          const menuItem = window.MozXULElement.parseXULToFragment(`
            <menuitem label="${gHumaUIManager.createValidXULText(workspace.name)}" huma-workspace-id="${workspace.uuid}" />
          `);
          if (workspace.uuid === activeWorkspace.uuid) {
            menuItem.querySelector("menuitem").setAttribute("disabled", "true");
          }
          menu.appendChild(menuItem);
        }
      });
    },
  
    async changeTabWorkspace(workspaceID) {
      const tabs = TabContextMenu.contextTab.multiselected 
        ? gBrowser.selectedTabs : [TabContextMenu.contextTab];
      for (let tab of tabs) {
        tab.setAttribute("huma-workspace-id", workspaceID);
      }
      const workspaces = await this._workspaces();
      await this.changeWorkspace(workspaces.workspaces.find(workspace => workspace.uuid === workspaceID));
    },
  };
  
HumaWorkspaces.init();