# cyTree

**Tree + AngularJS**

Code licensed under MIT License.

This plugin allows you create tree(treeview) easily and you can focus on your data.

## Compatibility

Work with modern browsers(Chrome/Firefox/Safari/IE9+).

* The tree uses custom icons(pure css), and the icons depend on CSS3.
* It's great if you use `bootstap3`. If not, set the `box-sizing` to `content-box`.

**Note**: You can custom the template or custom the icon style to avoid problems above.

## Usage

### install via bower

The package is registered to bower, so you can install via bower:

```shell
bower install cytree
```

### install manually

1. Download and include correct files in your webpage.(include `dist/cy-tree.js` and `dist/cy-tree.css`).
2. Add dependency to your angular project. 
3. Use `cyTree` and `treeData` directives to generate tree/treeview.

```html
<div class="cy-tree with-line" cy-tree='true' tree-data="treeData" tree-label-flag="name" tree-child-flag="list" debug-mode='true'></div>
```

## Demo

1. clone this project
2. run command below and you can see demo(`http://0.0.0.0:9080/`)

```shell
npm install && bower install
grunt serve
```

Tree images:

![tree](http://creeper-static.qiniudn.com/github-tree1.png)

![tree-select](http://creeper-static.qiniudn.com/github-tree2.png)

> You may run into the `watch ENOSPC` error due to *Inotify Watches Limit*. If so, run command `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`.


More demos are coming.

## Release History

2015-06-10&nbsp;&nbsp;&nbsp;&nbsp;`v0.2.0`&nbsp;&nbsp;&nbsp;&nbsp;add collapse and select event

2015-04-02&nbsp;&nbsp;&nbsp;&nbsp;`v0.1.0`&nbsp;&nbsp;&nbsp;&nbsp;v0.1.0
