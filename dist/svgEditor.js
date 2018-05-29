(function(window){

  function SVGEditor(options) {
    this.svgStage = options.el;
    this.scaleTimes = 1.0;
    this.initCell = {w: 0, h: 0};
    this.diagram = null;
  }

  SVGEditor.prototype._scaleHandle = function() {
    let {svgStage, scaleTimes, diagram} = this;
    svgStage.addEventListener('mousewheel', function(e) {
      let scale_w, scale_h, dw, dh, wRatio, hRatio;
      let svgStage_w = this.svgStage.clientWidth, svgStage_h = svgStage.clientHeight, scaleTimes = scaleTimes;
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
    }, false);
  }

  SVGEditor.prototype._getCellShape = function() {
    let cellH, cellW;
    let {svgStage, initCell} = this;
    cellH = Math.floor(svgStage.clientHeight / 15);
    cellW = ~~(cellH * 3.5);
    initCell.w = cellW;
    initCell.h = cellH;
  }





})(window)
