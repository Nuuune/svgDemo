(function(){
  this.SVGEditor = (function(window) {
    function SVGEditor(SVGDOM) {
      if(SVGDOM.tagName !== `svg`) throw Error(`需要传入svgHTMLDOM`);
      this.svgStage = SVGDOM;
      this.scaleTimes = 1;
      this.initCell = {w: 0, h: 0};
      this.diagram = null;

      // 格式化化svg标签属性
      this.svgStage.setAttribute(`viewBox`, `0 0 ${this.svgStage.clientWidth} ${this.svgStage.clientHeight}`);
      this.svgStage.setAttribute(`width`, `100%`);
      this.svgStage.setAttribute(`height`, `100%`);
      this.svgStage.setAttribute(`xmlns`, `http://www.w3.org/2000/svg`);
      this.svgStage.setAttribute(`xmlns:xlink`, `http://www.w3.org/1999/xlink`);
      this.svgStage.setAttribute(`version`, `1.1`);

      for(let fn in this.__proto__) {
        this[fn] = this[fn].bind(this);
      }

      this._init();
    }

    SVGEditor.prototype._bindScaleEvent = function() {
      let {svgStage, scaleTimes, diagram, _setScaleTimes} = this;
      svgStage.addEventListener('mousewheel', function(e) {
        let scale_w, scale_h, dw, dh, wRatio, hRatio;
        let svgStage_w = svgStage.clientWidth, svgStage_h = svgStage.clientHeight;
        if(e.deltaY > 0) {
          scaleTimes += 0.1;
          if(scaleTimes > 1.6) scaleTimes = 1.6;
        } else {
          scaleTimes -= 0.1;
          if(scaleTimes < 0.5) scaleTimes = 0.5;
        }
        wRatio = e.offsetX / svgStage_w;
        hRatio = e.offsetY / svgStage_h;
        scale_w = svgStage_w * scaleTimes;
        scale_h = svgStage_h * scaleTimes;
        dw = scale_w - svgStage_w;
        dh = scale_h - svgStage_h;
        svgStage.setAttribute(`viewBox`, `${-dw * wRatio} ${-dh * hRatio} ${scale_w} ${scale_h}`);
        diagram.scaleTimes = scaleTimes;
        _setScaleTimes(scaleTimes);
      }, false);
      return this;
    }

    SVGEditor.prototype._setScaleTimes = function(times) {
      this.scaleTimes = times;
      return this;
    }

    SVGEditor.prototype._getCellShape = function() {
      let cellH, cellW;
      let {svgStage, initCell} = this;
      cellH = Math.floor(svgStage.clientHeight / 15);
      cellW = ~~(cellH * 3.5);
      initCell.w = cellW;
      initCell.h = cellH;
      return this;
    }

    SVGEditor.prototype._setDiagram = function() {
      if(!(`SnappyDiagram` in window)) throw Error(`需要依赖SnappyDiagram库！`);

      let {diagram, svgStage, initCell} = this;
      let {SnappyDiagram} = window;

      /* 重写draw方法 保证每次调用时 清空当前SVG */
      let o = SnappyDiagram.prototype.draw;
      SnappyDiagram.prototype.draw = function() {
        this.snap.clear();
        this.markerEnd = this.triangleMarker(this.options.markerWidth, this.options.markerHeight);
        this.markerStart = this.triangleMarker(this.options.markerWidth, this.options.markerHeight, true);
        o.call(this);
      };

      this.diagram = new SnappyDiagram({el: svgStage, width: initCell.w, height: initCell.h, allowDrag: false});

      return this;
    }

    SVGEditor.prototype._diagram_addcell = function({ borderType, cellColor, text, img }) {
      let {diagram, initCell} = this;
      let cell = diagram.addBox(0, 0, { attrs: {width:initCell.w, height: initCell.h}, borderType, cellColor, text, img });
      if(diagram.options.allowDrag){
        diagram.draw();
      }else {
        this.toogleDrag();
      }
      return cell;
    }

    SVGEditor.prototype._clear_selected = function() {
      if(this.diagram.selected) this.diagram.selected = null;
      return this;
    }

    SVGEditor.prototype._init = function() {
      return this._getCellShape()._setDiagram()._bindScaleEvent();
    }

    /*******************SVGEditor 对外方法**********************/
    SVGEditor.prototype.update_selected = function(options) {
      let {text, borderType, cellColor} = options;
      let {diagram} = this;
      let selected = diagram.selected;

      if(!selected) return `当前没有选择节点`;
      if(!(text && (borderType >= 0) && cellColor)) return `参数缺少 text|borderType|cellColor`;
      if( selected.options.text === text
      && selected.options.borderType === borderType
      && selected.options.cellColor === cellColor) return `selected未有更新值`;

      selected.addText(text).addBorderType(borderType).addCellColor(cellColor);
      diagram.draw();
      diagram.selected = null;
    }

    SVGEditor.prototype.get_selected = function() {
      if(!this.diagram.selected) return null;
      let {text, borderType, cellColor} = this.diagram.selected.options;
      return {text, borderType, cellColor};
    }

    SVGEditor.prototype.get_allowDragStatus = function() {
      return this.diagram.options.allowDrag;
    }

    SVGEditor.prototype.toogleDrag = function() {
      let {diagram, _clear_selected} = this;
      diagram.options.allowDrag = !diagram.options.allowDrag;
      if(diagram.options.allowDrag) {
        _clear_selected();
      }
      diagram.draw();
      return this;
    }

    SVGEditor.prototype.addnew = function(type) {
      switch (type) {
        case 0:
          this._diagram_addcell({borderType: 1, cellColor: `cell-green`, text: `开始节点`, img: `/start.png`});
          break;
        case 1:
          this._diagram_addcell({borderType: 1, cellColor: `cell-red`, text: `结束节点`, img: `/start.png`});
          break;
        case 2:
          this._diagram_addcell({borderType: 0, cellColor: `cell-red`, text: `起章节点`, img: `/start.png`});
          break;
        default:
          this._diagram_addcell({borderType: 0, cellColor: `cell-white`, text: `默认节点`, img: `/start.png`});
      }
      return this;
    }

    SVGEditor.prototype.delCell = function() {
      let {diagram} = this;
      if(diagram.options.draggable || !diagram.selected) {
        return `请确保在非拖动模式或者已有选择cell下调用此方法`;
      }
      let arr = diagram.cells[0].map(item => item.element.id);
      let arr2 = diagram.connectors.map(item => item.element.id);

      let selected = diagram.selected;
      let sarr = selected.sourceConnections.map(item => item.element.id);
      let tarr = selected.targetConnections.map(item => item.element.id);
      sarr.forEach(item => {
        diagram.connectors[arr2.indexOf(item)] = undefined;
      });
      tarr.forEach(item => {
        diagram.connectors[arr2.indexOf(item)] = undefined;
      })
      diagram.connectors = diagram.connectors.filter(item => {
        return item !== undefined;
      })

      diagram.cells[0].splice(arr.indexOf(selected.element.id), 1);

      diagram.draw();
      return this;
    }
    return SVGEditor;
  })(this)

}).call(this)
