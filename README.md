#cyTree

**Tree + AngularJS**

Code licensed under MIT License.

This plugin allows you create tree(treeview) easily and you can focus on your data.

###Compatibility

Work with modern browsers(Chrome/Firefox/Safari/IE9+).

###How to use?

1. Make sure you load correct files in your webpage.(include `cy-tree.js` and `cy-tree.css`).
2. Add dependency to your angular project. 
3. Use `cyTree` and `treeData` directives to generate tree/treeview.

###Demo

1. clone this project
2. run command below
        npm install && bower install
        grunt serve

You may run into the `watch ENOSPC` error due to *Inotify Watches Limit*. If so, run command `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`.

---

More demos are coming.
