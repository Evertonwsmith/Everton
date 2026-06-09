// Power Factor Calculator - Interactive Chart with Two-Way Binding

class PowerFactorCalculator {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('powerTriangle');
        this.ctx = this.canvas.getContext('2d');
        
        // Input elements
        this.voltageInput = document.getElementById('voltage');
        this.frequencyInput = document.getElementById('frequency');
        this.resistanceInput = document.getElementById('resistance');
        this.reactanceInput = document.getElementById('reactance');
        
        // Output elements
        this.apparentPowerOutput = document.getElementById('apparentPower');
        this.activePowerOutput = document.getElementById('activePower');
        this.reactivePowerOutput = document.getElementById('reactivePower');
        this.impedanceOutput = document.getElementById('impedance');
        this.currentOutput = document.getElementById('current');
        this.powerFactorOutput = document.getElementById('powerFactor');
        
        // Display elements
        this.pfDisplay = document.getElementById('pfDisplay');
        this.angleDisplay = document.getElementById('angleDisplay');
        
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        // State
        this.mode = 'inductive'; // 'inductive' or 'capacitive'
        this.isDragging = false;
        
        // Chart dimensions - padding for labels and axes
        this.padding = { top: 30, right: 20, bottom: 30, left: 20 };
        this.handleRadius = 12;
        
        // Initialize
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.bindEvents();
        this.calculate();
        this.draw();
        
        // Handle resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
                this.draw();
            }, 150);
        });
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // Calculate canvas dimensions
        const width = containerWidth - 40; // Account for container padding
        const height = 350;
        
        // Set actual canvas size (for high DPI displays)
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Reset transform and scale
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        
        // Store dimensions
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        // Calculate the origin point for the power triangle
        // Center vertically to show both inductive (positive) and capacitive (negative) quadrants
        this.originX = this.padding.left + 40;
        this.originY = height / 2 + 10; // Centered vertically with slight offset
        
        // Calculate max radius to fit in the available space
        const availableWidth = width - this.originX - this.padding.right;
        const availableHeightUp = this.originY - this.padding.top;
        const availableHeightDown = height - this.originY - this.padding.bottom;
        const availableHeight = Math.min(availableHeightUp, availableHeightDown);
        this.maxRadius = Math.min(availableWidth, availableHeight) * 0.9;
    }
    
    bindEvents() {
        // Input event listeners
        this.voltageInput.addEventListener('input', () => this.onInputChange());
        this.frequencyInput.addEventListener('input', () => this.onInputChange());
        this.resistanceInput.addEventListener('input', () => this.onInputChange());
        this.reactanceInput.addEventListener('input', () => this.onInputChange());
        
        // Mode buttons
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;
                this.calculate();
                this.draw();
            });
        });
        
        // Canvas mouse events for dragging
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.onMouseUp());
    }
    
    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    getTouchCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
    
    onMouseDown(e) {
        const coords = this.getCanvasCoords(e);
        this.handleDragStart(coords);
    }
    
    onMouseMove(e) {
        const coords = this.getCanvasCoords(e);
        if (this.isDragging) {
            this.handleDragMove(coords);
        } else {
            // Check if hovering over handle
            const angle = this.getPhaseAngle();
            const tipPos = this.getTipPosition(angle);
            const distance = Math.sqrt(
                Math.pow(coords.x - tipPos.x, 2) + Math.pow(coords.y - tipPos.y, 2)
            );
            this.canvas.style.cursor = distance < this.handleRadius + 8 ? 'grab' : 'crosshair';
        }
    }
    
    onMouseUp() {
        this.isDragging = false;
        this.canvas.classList.remove('dragging');
    }
    
    onTouchStart(e) {
        e.preventDefault();
        const coords = this.getTouchCoords(e);
        this.handleDragStart(coords);
    }
    
    onTouchMove(e) {
        e.preventDefault();
        if (this.isDragging) {
            const coords = this.getTouchCoords(e);
            this.handleDragMove(coords);
        }
    }
    
    handleDragStart(coords) {
        const angle = this.getPhaseAngle();
        const tipPos = this.getTipPosition(angle);
        const distance = Math.sqrt(
            Math.pow(coords.x - tipPos.x, 2) + Math.pow(coords.y - tipPos.y, 2)
        );
        
        if (distance < this.handleRadius + 15) {
            this.isDragging = true;
            this.canvas.classList.add('dragging');
        }
    }
    
    handleDragMove(coords) {
        // Calculate angle from origin to mouse position
        const dx = coords.x - this.originX;
        const dy = this.originY - coords.y; // Invert Y because canvas Y is down
        
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Clamp angle to valid range (-85 to 85 degrees)
        angle = Math.max(-85, Math.min(85, angle));
        
        // Update reactance based on angle
        const R = parseFloat(this.resistanceInput.value) || 1;
        const tanTheta = Math.tan(angle * Math.PI / 180);
        let X = R * tanTheta;
        
        // Update reactance input
        this.reactanceInput.value = Math.abs(X).toFixed(2);
        
        // Update mode based on angle
        if (angle >= 0) {
            this.setMode('inductive');
        } else {
            this.setMode('capacitive');
        }
        
        this.calculate();
        this.draw();
    }
    
    setMode(mode) {
        this.mode = mode;
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }
    
    onInputChange() {
        this.calculate();
        this.draw();
    }
    
    getPhaseAngle() {
        const R = parseFloat(this.resistanceInput.value) || 0.01;
        let X = parseFloat(this.reactanceInput.value) || 0;
        
        if (this.mode === 'capacitive') {
            X = -Math.abs(X);
        } else {
            X = Math.abs(X);
        }
        
        return Math.atan2(X, R) * (180 / Math.PI);
    }
    
    getTipPosition(angle) {
        const angleRad = angle * Math.PI / 180;
        const R = parseFloat(this.resistanceInput.value) || 1;
        const X = parseFloat(this.reactanceInput.value) || 0;
        const Z = Math.sqrt(R * R + X * X);
        
        // Scale factor to fit on canvas
        const scale = this.maxRadius / (Z || 1);
        const length = Z * scale;
        
        return {
            x: this.originX + length * Math.cos(angleRad),
            y: this.originY - length * Math.sin(angleRad)
        };
    }
    
    calculate() {
        const V = parseFloat(this.voltageInput.value) || 0;
        const f = parseFloat(this.frequencyInput.value) || 60;
        const R = parseFloat(this.resistanceInput.value) || 0.01;
        let X = parseFloat(this.reactanceInput.value) || 0;
        
        if (this.mode === 'capacitive') {
            X = -Math.abs(X);
        } else {
            X = Math.abs(X);
        }
        
        // Calculate impedance
        const Z = Math.sqrt(R * R + X * X);
        
        // Calculate current
        const I = Z > 0 ? V / Z : 0;
        
        // Calculate powers
        const S = V * I; // Apparent power (VA)
        const P = I * I * R; // Active power (W)
        const Q = I * I * X; // Reactive power (VAR)
        
        // Calculate power factor
        const pf = Z > 0 ? R / Z : 1;
        
        // Calculate phase angle
        const angle = Math.atan2(X, R) * (180 / Math.PI);
        
        // Update output fields
        this.apparentPowerOutput.value = S.toFixed(2);
        this.activePowerOutput.value = P.toFixed(2);
        this.reactivePowerOutput.value = Q.toFixed(2);
        this.impedanceOutput.value = Z.toFixed(2);
        this.currentOutput.value = I.toFixed(2);
        this.powerFactorOutput.value = pf.toFixed(3);
        
        // Update displays
        this.pfDisplay.textContent = pf.toFixed(3);
        this.angleDisplay.textContent = angle.toFixed(2) + '°';
        
        // Store calculated values for drawing
        this.calculatedValues = { V, f, R, X, Z, I, S, P, Q, pf, angle };
    }
    
    draw() {
        if (!this.ctx || !this.calculatedValues) return;
        
        const ctx = this.ctx;
        const width = this.canvasWidth;
        const height = this.canvasHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        const { R, X, Z, I, S, P, Q, angle } = this.calculatedValues;
        const angleRad = angle * Math.PI / 180;
        
        // Scale factor
        const scale = this.maxRadius / (Z || 1);
        const length = Z * scale;
        
        // Calculate positions
        const tipX = this.originX + length * Math.cos(angleRad);
        const tipY = this.originY - length * Math.sin(angleRad);
        
        // P (active power) tip - projection on x-axis
        const pTipX = this.originX + length * Math.cos(angleRad);
        const pTipY = this.originY;
        
        // Draw grid
        this.drawGrid(ctx);
        
        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        
        // Horizontal axis (Active Power axis) - full width
        ctx.beginPath();
        ctx.moveTo(this.originX - 10, this.originY);
        ctx.lineTo(width - this.padding.right, this.originY);
        ctx.stroke();
        
        // Vertical axis (Reactive Power axis) - full height
        ctx.beginPath();
        ctx.moveTo(this.originX, this.padding.top);
        ctx.lineTo(this.originX, height - this.padding.bottom);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Draw axis arrow heads
        this.drawArrowHead(ctx, width - this.padding.right, this.originY, 'right');
        this.drawArrowHead(ctx, this.originX, this.padding.top, 'up');
        this.drawArrowHead(ctx, this.originX, height - this.padding.bottom, 'down');
        
        // Draw the triangle components
        // Draw P (active power) - horizontal component (green)
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(pTipX, pTipY);
        ctx.stroke();
        
        // Draw Q (reactive power) - vertical component (red)
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pTipX, pTipY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        
        // Draw S (apparent power) - hypotenuse (blue)
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        
        // Draw dotted line to complete the triangle visualization
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(pTipX, pTipY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw angle arc
        this.drawAngleArc(ctx, angleRad);
        
        // Draw handle at tip
        this.drawHandle(ctx, tipX, tipY);
        
        // Draw labels
        this.drawLabels(ctx, tipX, tipY, pTipX, S, P, Q, angle);
        
        // Draw axis labels
        this.drawAxisLabels(ctx);
    }
    
    drawArrowHead(ctx, x, y, direction) {
        const size = 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        
        if (direction === 'right') {
            ctx.moveTo(x, y - size / 2);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size / 2);
        } else if (direction === 'up') {
            ctx.moveTo(x - size / 2, y);
            ctx.lineTo(x, y - size);
            ctx.lineTo(x + size / 2, y);
        } else if (direction === 'down') {
            ctx.moveTo(x - size / 2, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x + size / 2, y);
        }
        ctx.fill();
    }
    
    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Full circles (both quadrants)
        for (let r = this.maxRadius * 0.25; r <= this.maxRadius; r += this.maxRadius * 0.25) {
            ctx.beginPath();
            ctx.arc(this.originX, this.originY, r, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();
        }
        
        // Radial lines (both positive and negative angles)
        for (let angle = -75; angle <= 75; angle += 15) {
            const rad = angle * Math.PI / 180;
            const endX = this.originX + this.maxRadius * Math.cos(rad);
            const endY = this.originY - this.maxRadius * Math.sin(rad);
            
            // Only draw if within canvas bounds
            if (endX >= 0 && endX <= this.canvasWidth && endY >= 0 && endY <= this.canvasHeight) {
                ctx.beginPath();
                ctx.moveTo(this.originX, this.originY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }
    
    drawAngleArc(ctx, angleRad) {
        const arcRadius = Math.min(30, this.maxRadius * 0.12);
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
        
        if (angleRad >= 0) {
            // Inductive (positive angle - upper quadrant)
            ctx.beginPath();
            ctx.arc(this.originX, this.originY, arcRadius, 0, angleRad);
            ctx.stroke();
        } else {
            // Capacitive (negative angle - lower quadrant)
            ctx.beginPath();
            ctx.arc(this.originX, this.originY, arcRadius, angleRad, 0);
            ctx.stroke();
        }
        
        // Angle label
        const labelAngle = angleRad / 2;
        const labelRadius = arcRadius + 14;
        const labelX = this.originX + labelRadius * Math.cos(labelAngle);
        const labelY = this.originY - labelRadius * Math.sin(labelAngle);
        
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.fillText('θ', labelX, labelY);
    }
    
    drawHandle(ctx, x, y) {
        // Ensure handle is within canvas bounds
        const margin = this.handleRadius + 5;
        x = Math.max(margin, Math.min(this.canvasWidth - margin, x));
        y = Math.max(margin, Math.min(this.canvasHeight - margin, y));
        
        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.handleRadius + 10);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, this.handleRadius + 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Main handle
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, this.handleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Inner circle
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(x, y, this.handleRadius - 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawLabels(ctx, tipX, tipY, pTipX, S, P, Q, angle) {
        ctx.font = 'bold 11px sans-serif';
        ctx.textBaseline = 'middle';
        
        // P label (green) - below the P vector
        const pLabelX = (this.originX + pTipX) / 2;
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'center';
        const pLabelY = this.originY + 18;
        ctx.fillText(`P = ${P.toFixed(1)}W`, pLabelX, pLabelY);
        
        // Q label (red) - next to Q vector
        const qMidX = (pTipX + tipX) / 2;
        const qMidY = (this.originY + tipY) / 2;
        ctx.fillStyle = '#f87171';
        ctx.textAlign = Math.abs(angle) > 50 ? 'right' : 'left';
        const qOffset = angle >= 0 ? 10 : -10;
        ctx.fillText(`Q = ${Math.abs(Q).toFixed(1)}VAR`, qMidX + qOffset, qMidY);
        
        // S label (blue) - next to S vector
        const sMidX = (this.originX + tipX) / 2;
        const sMidY = (this.originY + tipY) / 2;
        ctx.fillStyle = '#60a5fa';
        const sOffsetX = angle >= 0 ? -12 : 12;
        const sOffsetY = angle >= 0 ? -10 : 10;
        ctx.textAlign = 'center';
        ctx.fillText(`S = ${S.toFixed(1)}VA`, sMidX + sOffsetX, sMidY + sOffsetY);
    }
    
    drawAxisLabels(ctx) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        
        // X-axis label (Active Power)
        const xAxisLabelX = this.originX + this.maxRadius / 2;
        ctx.fillText('Active Power P (W)', xAxisLabelX, this.originY + 25);
        
        // Y-axis labels
        ctx.textAlign = 'right';
        
        // Inductive (positive Q) label
        ctx.fillText('Q (VAR)', this.originX - 8, this.padding.top + 15);
        ctx.fillText('(Inductive)', this.originX - 8, this.padding.top + 28);
        
        // Capacitive (negative Q) label
        const capLabelY = this.canvasHeight - this.padding.bottom - 10;
        ctx.fillText('(Capacitive)', this.originX - 8, capLabelY);
        
        // Origin label
        ctx.textAlign = 'center';
        ctx.fillText('0', this.originX - 8, this.originY + 4);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PowerFactorCalculator();
});