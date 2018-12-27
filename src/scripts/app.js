var SiteStorage = function() {
    return {
        IsChecked: false,
        Name: "",
        FavoriteColor: "",
        CurrentTab: "",
        CurrentBrowser: ""
    };
};

var NavItem = function() {
    return {
        Id: 0,
        Text: "",
        TabName: "",
        Title: "",
        Href: "",
        Target: "",
        Classes: Array(),
        IsCurrent: false,
        Icon: ""
    };
};

var colorOptions = [
    '',
    'Red',
    'Green',
    'Blue',
    'LightBlue',
    'Gray',
    'White',
    'Orange',
    'Purple',
    'Teal',
    'Yellow'
];

var NavigationItemViewModel = function() {
    var nivm = this;

    nivm.Text = ko.observable("");
    nivm.Title = ko.observable("");
    nivm.Href = ko.observable("");
    nivm.Target = ko.observable("");
    nivm.IsCurrent = ko.observable(false);
    nivm.Id = ko.observable(0);
    nivm.TabName = ko.observable("");
    nivm.Classes = ko.observableArray([]);
    nivm.Icon = ko.observable("");
    nivm.ClassList = ko.computed(function() {
        var returnValue = nivm.Classes().join(' ');
        if (nivm.IsCurrent()) {
            returnValue += ' active';
        }

        return returnValue;
    }, this);
};

var NavigationViewModel = function() {
    var nvm = this;

    nvm.Items = ko.observableArray([]);

    nvm.Populate = function(data) {
        if (data) {
            for(let i = 0; i < data.length; i++) {
                var newItem = new NavigationItemViewModel();
                newItem.Title(data[i].Title);
                newItem.Href(data[i].Href);
                newItem.Text(data[i].Text);
                newItem.Target(data[i].Target);
                newItem.TabName(data[i].TabName);
                newItem.IsCurrent(data[i].IsCurrent);
                newItem.Id(data[i].Id);
                newItem.Icon(data[i].Icon);
                newItem.Classes(data[i].Classes);
                nvm.Items.push(newItem);
            }
        }
    }

    nvm.Select = function(data) {
        ko.utils.arrayForEach(nvm.Items(), function(item) {
            console.log(item);
            if (item.Id() == data || item.TabName() == data) {
                item.IsCurrent(true);
            }
        }, this);
    };

    nvm.Deselect = function(data) {
        ko.utils.arrayForEach(nvm.Items(), function(item) {
            if (item.Id() == data || item.TabName() == data) {
                item.IsCurrent(false);
            }
        }, nvm);
    };
};

var UserFormViewModel = function() {
    var ufvm = this;

    ufvm.DisclaimerChecked = ko.observable(false);
    ufvm.Name = ko.observable("");
    ufvm.Browser = ko.observable("");
};

var PreferencesViewModel = function() {
    var pvm = this;

    pvm.FavoriteColor = ko.observable("");
};

var TabsViewModel = function() {
    var tvm = this;
    tvm.CurrentTab = ko.observable("user");
    tvm.User = new UserFormViewModel();
    tvm.Preferences = new PreferencesViewModel();
};

var ApplicationViewModel = function() {
    var avm = this;
    avm.Tabs = new TabsViewModel();
    avm.Navigation = new NavigationViewModel();
};

// JavaScript module pattern
// Use Site. within the html to access methods exposed via the final "return" statement.
var Site = (function() {
    var self = this;
    var siteStorageKey = "";
    var debugMode = false;
    function boxChecked(isChecked) {
        if (isChecked != undefined && isChecked != null) {
            storage.SetItem('IsChecked', isChecked);
        } else {
            return storage.GetItem('IsChecked');
        }
    }

    var storage = (function() {
        var handle = window.localStorage;
        function setItem(name, value) {
            var item = handle.getItem(siteStorageKey);
            var itemData = null;
            if (!item) {
                itemData = new SiteStorage();
            } else {
                itemData = JSON.parse(item);
            }
            if (name) {
                itemData[name] = value;
            }
            
            handle.setItem(siteStorageKey, JSON.stringify(itemData));
        };

        function getItem(name) {
            if (name) {
                if (handle.getItem(siteStorageKey)) {
                    var itemData = JSON.parse(handle.getItem(siteStorageKey));
                    return itemData[name];
                } else {
                    return undefined;
                }
            } else {
                var itemData = JSON.parse(handle.getItem(siteStorageKey));
                return itemData;
            }
        };

        return {
            SetItem: setItem,
            GetItem: getItem
        };
    })();

    self.BoxChecked = boxChecked;
    self.Storage = storage;
    self.Debug = function(mode) {
        if (mode != undefined) {
            debugMode = mode;
        }
    };

    self.Setup = function(args) {
        if (args) {
            if (args.siteStorageKey) {
                siteStorageKey = args.siteStorageKey;
            } else {
                throw Error("Missing site local stoage key.");
            }

            if (args.navigation) {
                self.Navigation.BuildNav(args.navigation);
            }

            if (args.debug) {
                self.Debug(args.debug);
            }

            self.Log("Setup Complete");
        } else {
            throw Error("Missing setup arguments.");
        }

        if (!storage.GetItem(siteStorageKey)) {
            storage.SetItem(null, new SiteStorage());
        }
    };

    self.Forms = (function() {
        var forms = this;

        forms.LoadFromStorage = function() {
            self.Log("Attempting to load page data from local storage.");

            var storedData = storage.GetItem(null);

            if (storedData) {
                self.Log("Found local storage state to load.");
                self.Log(storedData);
                self.ViewModel.Tabs.User.Name(storedData.Name);
                self.ViewModel.Tabs.User.DisclaimerChecked(storedData.IsChecked);
                self.ViewModel.Tabs.Preferences.FavoriteColor(storedData.FavoriteColor);
                self.ViewModel.Tabs.CurrentTab(storedData.CurrentTab);
                if (!storedData.CurrentBrowser) {
                    storedData.CurrentBrowser = navigator.userAgent;
                    self.Storage.SetItem("CurrentBrowser", navigator.userAgent);
                }
                
                self.ViewModel.Tabs.User.Browser(storedData.CurrentBrowser);
                self.Navigation.SetCurrent(storedData.CurrentTab);
            } else {
                self.Log("No stored data found.  This typically happens on the first load.");
            }

            setTimeout(function() { 
                $(".modal-wrapper").fadeOut(300);
                $(".load-wrapper").fadeOut(200);
             }, 200);
        };

        return forms;
    })();

    self.ViewModel = new ApplicationViewModel();

    self.Navigation = (function() {
        var nav = this;
        
        nav.Items = Array();
        nav.Data = self.ViewModel.Navigation;

        function findItemById(id) {
            return nav.Items.filter(function(el) {
                return el.Id == id;
            });
        }

        function findItemByTabName(tabName) {
            return nav.Items.filter(function(el) {
                return el.TabName == tabName;
            });

            return null;
        }

        function findCurrent() {
            return nav.Items.filter(function(el) {
                return el.IsCurrent == true;
            });

            return null;
        }

        nav.BuildNav = function(items) {
            if (items) {
                if (items.length > 0) {
                    self.Log("Attemtping to build navigation from the given items: " + items + ".");
                    self.Log(items);
                    for(let i = 0; i < items.length; i ++) {
                        var navItem = new NavItem();

                        navItem.Id = i;
                        navItem.Title = items[i].Title;
                        navItem.Text = items[i].Text;
                        navItem.Href = items[i].Href;
                        navItem.TabName = items[i].TabName;
                        navItem.Target = items[i].Target;
                        navItem.Icon = items[i].Icon;
                        navItem.Classes = items[i].Classes;
                        
                        nav.Items.push(navItem);
                    }

                    nav.Data.Populate(nav.Items);
                }
            }
        };

        nav.SetCurrent = function(id) {
            self.Log("Attempting to set the currently active tab to '" + id + "'.");
            if (id) {
                var newItem = findItemById(id); // attempt to first find by ID
                if (!newItem || newItem.length <= 0) {
                    self.Log("Could not find the link with the ID: " + id + ".  Attempting to load by tab name.");
                    // Then by tab name
                    newItem = findItemByTabName(id);
                }

                if (newItem && newItem.length > 0) {
                    self.Log("Found a link to select");
                    newItem = newItem[0];
                    var existingCurrent = findCurrent();
                    if (existingCurrent && existingCurrent.length > 0) {
                        self.Log("Deselecting the previous link: " + existingCurrent.Text + ".");
                        existingCurrent[0].IsCurrent = false;
                        nav.Data.Deselect(existingCurrent[0].Id);
                    } else {
                        self.Log("No previous link to deselect");
                    }

                    newItem.IsCurrent = true;
                    nav.Data.Select(newItem.TabName);
                    self.ViewModel.Tabs.CurrentTab(newItem.TabName);
                    self.Storage.SetItem("CurrentTab", newItem.TabName);
                } else {
                    self.Log("Could not find selected link " + id + ".");
                }
            }
        };

        return nav;
    })();

    self.Log = function(message) {
        if (debugMode) {
            var current = Date();
            console.log(current.toLocaleString() + ' - ' + message);
            if (typeof message === 'object') {
                console.log(message);
            }
        }
    };

    return self;
})();