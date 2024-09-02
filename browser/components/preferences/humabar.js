var gHumaBar = {
  async loadPage() {
    try {
      await gHumaBrowserManagerSidebar._showPrefsPage();
      await gHumaBrowserManagerSidebar._createHumabar();
      
      /*const search = document.getElementById("search-list");
      if (search) {
        search.addEventListener('click', () => this.setDuckDuckGoAsDefault());
      } else {
        console.error("search-list element not found");
      }*/
    } catch (error) {
      console.error("Error in loadPage:", error);
    }
  },

  async setDuckDuckGoAsDefault() {
    try {
      const engines = await Services.search.getVisibleEngines();
      const duckduckgo = engines.find(e => e.name.toLowerCase() === "duckduckgo");
      
      if (duckduckgo) {
        await Services.search.setDefault(duckduckgo, Ci.nsISearchService.CHANGE_REASON_USER);
        console.log("DuckDuckGo set as default search engine");
      } else {
        console.log("DuckDuckGo not found in search engines");
      }
    } catch (error) {
      console.error("Error setting DuckDuckGo as default:", error);
    }
  },

  async _openAddPanelDialog() {
    try {
      const dialogURL = "chrome://browser/content/places/humabar-settings.xhtml";
      const features = "centerscreen,chrome,modal,resizable=no";
      const aParentWindow = Services.wm.getMostRecentWindow("navigator:browser");
      
      if (aParentWindow?.gDialogBox) {
        await aParentWindow.gDialogBox.open(dialogURL, {});
      } else if (aParentWindow) {
        aParentWindow.openDialog(dialogURL, "", features, {});
      } else {
        console.error("No parent window found");
      }
    } catch (error) {
      console.error("Error opening add panel dialog:", error);
    }
  },

  init() {
    this.loadPage().catch(error => console.error("Error initializing HumaBar:", error));
  },
};

gHumaBar.init();