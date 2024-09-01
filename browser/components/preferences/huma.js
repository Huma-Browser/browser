
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Temayı al
if (!AddonManager) {
    var { AddonManager } = ChromeUtils.importESModule(
      "resource://gre/modules/AddonManager.sys.mjs"
    ); 
  }
  
  var gHumaLookNFeel = {
  
    helo(){
      console.log("helo");
    },
  
      
    
     
  
    updatePreferenceFromCheckbox(prefName, checkboxId) {
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) {
        const isChecked = checkbox.checked;
        try {
          Services.prefs.setBoolPref(prefName, isChecked);
          if (prefName === "huma.compact.mode") {
           
            /*
               Services.prefs.setBoolPref("sidebar.verticalTabs", false);
               Services.prefs.setBoolPref("sidebar.revamp", false);

            */
            
        }
        } catch (error) {
          console.error(`Tercih güncellenirken hata oluştu (${prefName}):`, error);
        }
      }
    },
  
    updateCheckboxFromPreference(prefName, checkboxId) {
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) {
        try {
          const prefValue = Services.prefs.getBoolPref(prefName);
          checkbox.checked = prefValue;
          if (prefName === "huma.compact.mode") {
           
            
               Services.prefs.setBoolPref("sidebar.verticalTabs", false);
               Services.prefs.setBoolPref("sidebar.revamp", false);
             
        }
        } catch (error) {
          console.error(`Tercih okunurken hata oluştu (${prefName}):`, error);
        }
      }
  
    },
  
    checkboxInitialize() {
      const prefs = [
        { name: "sidebar.verticalTabs", id: "verticalTabCheckBox" },
        { name: "huma.compact.mode", id: "comapactModeCheckBox" },
        { name: "sidebar.revamp", id: "sidebarCheckBox" },
        { name: "userChrome.compatibility.os", id: "compatibilityOsCheckBox" },
        { name: "userChrome.compatibility.theme", id: "compatibilityThemeCheckBox" },
        { name: "userChrome.decoration.animate", id: "decorationAnimateCheckBox" },
        { name: "userChrome.decoration.cursor", id: "decorationCursorCheckBox" },
        { name: "userChrome.decoration.download_panel", id: "decorationDownloadPanelCheckBox" },
        { name: "userChrome.decoration.field_border", id: "decorationFieldBorderCheckBox" },
        { name: "userChrome.fullscreen.overlap", id: "fullscreenOverlapCheckBox" },
        { name: "userChrome.fullscreen.show_bookmarkbar", id: "fullscreenShowBookmarkbarCheckBox" },
        { name: "userChrome.icon.1-25px_stroke", id: "icon1_25pxStrokeCheckBox" },
        { name: "userChrome.icon.global_menu", id: "iconGlobalMenuCheckBox" },
        { name: "userChrome.icon.global_menubar", id: "iconGlobalMenubarCheckBox" },
        { name: "userChrome.icon.library", id: "iconLibraryCheckBox" },
        { name: "userChrome.icon.menu", id: "iconMenuCheckBox" },
        { name: "userChrome.icon.panel", id: "iconPanelCheckBox" },
        { name: "userChrome.icon.panel_full", id: "iconPanelFullCheckBox" },
        { name: "userChrome.icon.panel_photon", id: "iconPanelPhotonCheckBox" },
        { name: "userChrome.padding.bookmark_menu", id: "paddingBookmarkMenuCheckBox" },
        { name: "userChrome.padding.bookmarkbar", id: "paddingBookmarkbarCheckBox" },
        { name: "userChrome.padding.global_menubar", id: "paddingGlobalMenubarCheckBox" },
        { name: "userChrome.padding.infobar", id: "paddingInfobarCheckBox" },
        { name: "userChrome.padding.menu", id: "paddingMenuCheckBox" },
        { name: "userChrome.padding.navbar_width", id: "paddingNavbarWidthCheckBox" },
        { name: "userChrome.padding.panel", id: "paddingPanelCheckBox" },
        { name: "userChrome.padding.popup_panel", id: "paddingPopupPanelCheckBox" },
        { name: "userChrome.padding.tabbar_height", id: "paddingTabbarHeightCheckBox" },
        { name: "userChrome.padding.tabbar_width", id: "paddingTabbarWidthCheckBox" },
        { name: "userChrome.padding.toolbar_button", id: "paddingToolbarButtonCheckBox" },
        { name: "userChrome.padding.urlbar", id: "paddingUrlbarCheckBox" },
        { name: "userChrome.rounding.square_tab", id: "roundingSquareTabCheckBox" },
        { name: "userChrome.tab.bar_separator", id: "tabBarSeparatorCheckBox" },
        { name: "userChrome.tab.bottom_rounded_corner", id: "tabBottomRoundedCornerCheckBox" },
        { name: "userChrome.tab.box_shadow", id: "tabBoxShadowCheckBox" },
        { name: "userChrome.tab.close_button_at_hover", id: "tabCloseButtonAtHoverCheckBox" },
        { name: "userChrome.tab.color_like_toolbar", id: "tabColorLikeToolbarCheckBox" },
        { name: "userChrome.tab.connect_to_window", id: "tabConnectToWindowCheckBox" },
        { name: "userChrome.tab.container", id: "tabContainerCheckBox" },
        { name: "userChrome.tab.crashed", id: "tabCrashedCheckBox" },
        { name: "userChrome.tab.dynamic_separator", id: "tabDynamicSeparatorCheckBox" },
        { name: "userChrome.tab.lepton_like_padding", id: "tabLeptonLikePaddingCheckBox" },
        { name: "userChrome.tab.letters_cleary", id: "tabLettersClearyCheckBox" },
        { name: "userChrome.tab.multi_selected", id: "tabMultiSelectedCheckBox" },
        { name: "userChrome.tab.newtab_button_like_tab", id: "tabNewtabButtonLikeTabCheckBox" },
        { name: "userChrome.tab.newtab_button_proton", id: "tabNewtabButtonProtonCheckBox" },
        { name: "userChrome.tab.newtab_button_smaller", id: "tabNewtabButtonSmallerCheckBox" },
        { name: "userChrome.tab.photon_like_contextline", id: "tabPhotonLikeContextlineCheckBox" },
        { name: "userChrome.tab.photon_like_padding", id: "tabPhotonLikePaddingCheckBox" },
        { name: "userChrome.tab.pip", id: "tabPipCheckBox" },
        { name: "userChrome.tab.sound_hide_label", id: "tabSoundHideLabelCheckBox" },
        { name: "userChrome.tab.sound_with_favicons", id: "tabSoundWithFaviconsCheckBox" },
        { name: "userChrome.tab.static_separator", id: "tabStaticSeparatorCheckBox" },
        { name: "userChrome.tab.static_separator.selected_accent", id: "tabStaticSeparatorSelectedAccentCheckBox" },
        { name: "userChrome.tab.unloaded", id: "tabUnloadedCheckBox" },
        { name: "userChrome.theme.built_in_contrast", id: "themeBuiltInContrastCheckBox" },
        { name: "userChrome.theme.fully_color", id: "themeFullyColorCheckBox" },
        { name: "userChrome.theme.fully_dark", id: "themeFullyDarkCheckBox" },
        { name: "userChrome.theme.proton_chrome", id: "themeProtonChromeCheckBox" },
        { name: "userChrome.theme.proton_color", id: "themeProtonColorCheckBox" }
      ];
  
      prefs.forEach(pref => {
        this.updateCheckboxFromPreference(pref.name, pref.id);
  
        const checkbox = document.getElementById(pref.id);
        if (checkbox) {
          checkbox.addEventListener('command', () => {
            this.updatePreferenceFromCheckbox(pref.name, pref.id);
          });
        } else {
          console.error(`Checkbox elementi bulunamadı (${pref.id})`);
        }
      });
    },
  
    initializePreference() {
      // Eğer tercih yoksa, boş bir dizi olarak başlat
      if (!Services.prefs.prefHasUserValue("huma.preference.page.palette")) {
        Services.prefs.setStringPref("huma.preference.page.palette", JSON.stringify([]));
      }
    },
  
    applyPalette(palette) {
      // Yeni paleti doğrudan kaydet
      let currentPaletteData = {
        "backgroundColor": palette.backgroundColor,
        "pagePaneColor": palette.pagePaneColor
      };
    
      // Paleti JSON olarak kaydet
      Services.prefs.setStringPref("huma.preference.page.palette", JSON.stringify(currentPaletteData));
    
      // Stilleri uygula
      this.applyStyles(palette);
    },
    
    applyStyles(palette) {
      document.body.style.backgroundColor = palette.backgroundColor;
      document.querySelector('.navigation').style.backgroundColor = palette.pagePaneColor;
      document.querySelector('#mainPrefPane').style.backgroundColor = palette.pagePaneColor;
    },
    
    applyLastPalette() {
      // Son kaydedilen paleti al
      let lastPalette = JSON.parse(Services.prefs.getStringPref("huma.preference.page.palette"));
      
      // Eğer palet varsa, stilleri uygula
      if (lastPalette) {
        this.applyStyles(lastPalette);
      }
    },
  
    create() {
      const paletteList = document.getElementById('paletteList');
      if (!paletteList) {
        console.error("paletteList element not found");
        return;
      }
    
      const palettes = JSON.parse(Services.prefs.getStringPref("huma.preference.colors"));
    
      for (const [key, palette] of Object.entries(palettes)) {
        const paletteElement = document.createElement('div');
        paletteElement.className = 'palette';
        paletteElement.innerHTML = `
          <div class="palette-half" style="background-color: ${palette.backgroundColor};"></div>
          <div class="palette-half" style="background-color: ${palette.pagePaneColor};"></div>
         
        `;
        paletteElement.addEventListener('click', () => this.applyPalette(palette));
        paletteList.appendChild(paletteElement);
      }
  
    },
  
   async _createThemePalette() {
      try {
          // Aktif tema ID
          let currentTheme = Services.prefs.getCharPref("extensions.activeThemeID");
       
  
          // Eklenti nesnesi
          let addon = await AddonManager.getAddonByID(currentTheme);
  
          if (addon) {
              // rootURI'den manifest.json dosyasının tam yolunu oluşturun
             
              const manifestPath = addon.__AddonInternal__.rootURI + "manifest.json";
          
              //console.log(addon);
              //console.log(addon.screenshots);
              
              let response = await fetch(manifestPath);
              if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
              }
              let manifestContent = await response.json();
             
              //toolbar: "rgb(20, 20, 25)"
              //toolbar_field: "rgb(32, 32, 35)"
              let themeBgColor = manifestContent.theme.colors.toolbar;
              let themePaneContentColor = manifestContent.theme.colors.toolbar_field;
              let themeScreenShot = addon.screenshots[0];
              let themeParagraf = `${addon.creator.name} | ${addon.name}:${addon.version} | ${addon.description} ` 
              //console.log(themeScreenShot);
              //console.log(themeScreenShot.url);
              const themePalette = {
                "backgroundColor": themeBgColor,
                "pagePaneColor": themePaneContentColor,
                "screenShot": themeScreenShot.url,
                "paragraf": themeParagraf,
              }
              const themePaletteList = document.getElementById('humabar-table')
              // Mevcut içeriği temizle
              themePaletteList.innerHTML = '';
  
   
              const themeScreenShotElement = document.createElement('div');
              themeScreenShotElement.innerHTML = `
               <div class="theme-card">
                    <img class="theme-card-image" src="${themePalette.screenShot}" />
                    <p>${themePalette.paragraf}</p>
                </div>
                `
             
              themeScreenShotElement.addEventListener('click', () => this.applyPalette(themePalette));
              themePaletteList.appendChild(themeScreenShotElement);
  
              
              
          } else {
              console.error("Tema eklentisi bulunamadı");
          }
      } catch (error) {
          console.error("Hata oluştu:", error);
      }
  },
    
  
     
    
  };
 
  
  // init fonksiyonuna buton dinleyiciyi ekle
  gHumaLookNFeel.init = function () {
    this.initializePreference();
    this.create();
    this.applyLastPalette();
    this.checkboxInitialize();
    this._createThemePalette();
    this.addButtonListener(); // Buton dinleyici eklendi
  };
  
  // Başlatmak için çağır
  gHumaLookNFeel.init();
  
  
  