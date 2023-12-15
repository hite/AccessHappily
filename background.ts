
export {}
 
console.log(
  "Live now; make now always the most precious time. Now will never come again."
)
const handleContextMenus = () => {
    // remove existing menu items
    chrome.contextMenus.removeAll();
  
    // create a menu
    chrome.contextMenus.create({
      title: "生成规则（beta）",
      id: "detectElement",
      // show the menu over everything
      contexts: ["all"]
      // IMPORTANT: because we are no longer using a
      // persistent background script we will need to
      // add an event listener outside contextMenus.create.
    });
  
    // handle interactions
    chrome.contextMenus.onClicked.addListener(menu => {
        console.log(menu);
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'detectElement',
            menuId: menu.menuItemId
        });
      });
    });
  };

  handleContextMenus();
/////////