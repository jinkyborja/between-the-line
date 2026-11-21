<!--
	An original painted reading corner (window light, shelf, armchair, lamp, journal, plant),
	built from CSS so it needs no image download. Purely decorative.
	Responds to the nearest container (`container-type: inline-size`) — on narrow
	containers it simplifies to a top band.
-->
<div class="scene" aria-hidden="true">
	<div class="wall"></div>
	<div class="window"></div>
	<div class="curtain l"></div>
	<div class="curtain r"></div>
	<div class="shelf"><div class="row r1"></div><div class="row r2"></div><div class="row r3"></div><div class="row r4"></div></div>
	<div class="floor"></div>
	<div class="rug"></div>
	<div class="lampglow"></div>
	<div class="lamp"></div>
	<div class="shade"></div>
	<div class="chair"><div class="back"></div><div class="arm a"></div><div class="arm b"></div><div class="seat"></div><div class="leg a"></div><div class="leg b"></div></div>
	<div class="throw"></div>
	<div class="table"><div class="top"></div><div class="stem"></div></div>
	<div class="books"><i></i><i></i><i></i></div>
	<div class="journal"></div>
	<div class="cup"></div>
	<div class="plant"><div class="leaf e"></div><div class="leaf a"></div><div class="leaf b"></div><div class="leaf c"></div><div class="leaf d"></div><div class="pot"></div></div>
	<div class="beam"></div>
	<div class="dim"></div>
	<div class="vignette"></div>
	<div class="grain"></div>
</div>

<style>
	.scene { position: absolute; inset: 0; overflow: hidden; animation: sceneIn 1.6s var(--ease-out) both; }
	.scene > div, .scene div { position: absolute; }
	.wall {
		inset: 0;
		background:
			radial-gradient(ellipse 55% 70% at 30% 18%, rgb(255 214 160 / 0.55), rgb(255 214 160 / 0) 70%),
			radial-gradient(ellipse 40% 45% at 62% 58%, rgb(255 190 120 / 0.38), rgb(255 190 120 / 0) 70%),
			linear-gradient(180deg, #8f6f5c 0%, #6e5244 48%, #4a362d 100%);
	}
	.window {
		left: 12%; top: -4%; width: 30%; height: 66%;
		background: linear-gradient(180deg, #fff1d8 0%, #f6d7ae 55%, #e8b98a 100%);
		box-shadow: 0 0 120px 40px rgb(255 220 170 / 0.35);
		filter: blur(1.5px);
	}
	.window::before {
		content: ''; position: absolute; inset: 0; box-sizing: border-box; border: 14px solid #5a4035;
		background:
			linear-gradient(90deg, transparent calc(50% - 5px), #5a4035 calc(50% - 5px), #5a4035 calc(50% + 5px), transparent calc(50% + 5px)),
			linear-gradient(180deg, transparent calc(46% - 5px), #5a4035 calc(46% - 5px), #5a4035 calc(46% + 5px), transparent calc(46% + 5px));
	}
	.curtain { top: -4%; height: 74%; width: 9%; opacity: 0.9; filter: blur(2px); background: linear-gradient(90deg, #c9a89b, #b48f81 40%, #d8bcae 70%, #a98577); }
	.curtain.l { left: 7%; }
	.curtain.r { left: 39%; }
	.beam {
		left: 14%; top: 30%; width: 70%; height: 90%; filter: blur(8px); mix-blend-mode: screen;
		background: linear-gradient(115deg, rgb(255 226 180 / 0.32), rgb(255 226 180 / 0) 60%);
		clip-path: polygon(0 0, 38% 0, 100% 100%, 40% 100%);
	}
	.shelf { right: -2%; top: 6%; width: 34%; height: 70%; background: #4a352c; box-shadow: inset 0 0 40px rgb(0 0 0 / 0.35); filter: blur(2.5px); }
	.row {
		left: 5%; right: 5%; height: 17%; border-bottom: 10px solid #5d4337;
		background: repeating-linear-gradient(90deg, #8c7568 0 18px, #c9a89b 18px 30px, #6b4a3c 30px 52px, #eae0d3 52px 62px, #9b5f50 62px 84px, #7a6a5c 84px 98px, #d8bcae 98px 112px, #3b2d27 112px 126px, #b08a6f 126px 150px, transparent 150px 168px);
	}
	.r1 { top: 6%; }
	.r2 { top: 30%; background-position: 60px 0; }
	.r3 { top: 54%; background-position: -90px 0; }
	.r4 { top: 78%; background-position: 30px 0; }
	.floor { left: 0; right: 0; bottom: 0; height: 24%; background: linear-gradient(180deg, #3d2c25, #2a1f1b); }
	.rug { left: 30%; bottom: 3%; width: 46%; height: 10%; border-radius: 50%; opacity: 0.55; filter: blur(3px); background: radial-gradient(ellipse, #8c7568, #6e5244 70%, transparent 72%); }
	.lampglow { left: 60%; top: 22%; width: 30%; height: 42%; filter: blur(6px); background: radial-gradient(circle, rgb(255 200 130 / 0.6), rgb(255 200 130 / 0) 65%); }
	.lamp { left: 71%; top: 30%; width: 2px; height: 48%; background: #2e221d; }
	.shade { left: 67.5%; top: 25%; width: 7.5%; height: 9%; background: linear-gradient(180deg, #f3dcc0, #e2bf98); clip-path: polygon(18% 0, 82% 0, 100% 100%, 0 100%); }
	.chair { left: 47%; top: 44%; width: 24%; height: 40%; filter: blur(1px); }
	.chair .back { left: 8%; top: 0; width: 84%; height: 72%; border-radius: 46% 46% 12% 12%; background: linear-gradient(160deg, #c9a89b, #a5806f 60%, #7d5e50); }
	.chair .seat { left: 0; top: 52%; width: 100%; height: 34%; border-radius: 22px; background: linear-gradient(180deg, #b99484, #8a6a5b); }
	.chair .arm { top: 40%; width: 20%; height: 46%; border-radius: 30px; background: linear-gradient(180deg, #bf9b8b, #8f6e5f); }
	.chair .arm.a { left: -6%; }
	.chair .arm.b { right: -6%; }
	.chair .leg { bottom: 2%; width: 3%; height: 14%; background: #2e221d; }
	.chair .leg.a { left: 10%; }
	.chair .leg.b { right: 10%; }
	.throw { left: 52%; top: 57%; width: 12%; height: 16%; border-radius: 8px; transform: rotate(-8deg); opacity: 0.9; filter: blur(0.8px); background: repeating-linear-gradient(45deg, #eae0d3 0 6px, #d9c9b6 6px 12px); }
	.table { left: 39%; top: 62%; width: 9%; height: 22%; }
	.table .top { left: 0; top: 0; width: 100%; height: 8%; border-radius: 50%; background: #5d4337; }
	.table .stem { left: 47%; top: 6%; width: 6%; height: 94%; background: #3b2d27; }
	.books { left: 39.5%; top: 57%; width: 8%; height: 5.5%; }
	.books i { display: block; height: 33%; border-radius: 2px; margin: 0 auto; }
	.books i:nth-child(1) { width: 80%; background: #9b5f50; }
	.books i:nth-child(2) { width: 92%; background: #eae0d3; }
	.books i:nth-child(3) { width: 86%; background: #6b4a3c; }
	.journal { left: 41%; top: 55.6%; width: 5%; height: 1.6%; border-radius: 1px; transform: rotate(-6deg); background: #c9a89b; }
	.cup { left: 45.6%; top: 55.8%; width: 1.5%; height: 2.4%; border-radius: 0 0 6px 6px; background: #f7f2ea; }
	.plant { left: 4%; top: 48%; width: 14%; height: 36%; filter: blur(2px); }
	.plant .pot { left: 28%; bottom: 0; width: 44%; height: 26%; border-radius: 4px 4px 14px 14px; background: linear-gradient(180deg, #c9a89b, #8c7568); }
	.plant .leaf { width: 26%; height: 44%; border-radius: 50% 0; background: linear-gradient(135deg, #7d8a62, #4f5c3e); }
	.leaf.a { left: 20%; top: 16%; transform: rotate(-28deg); }
	.leaf.b { left: 46%; top: 6%; transform: rotate(18deg); }
	.leaf.c { left: 34%; top: 28%; transform: rotate(-4deg); }
	.leaf.d { left: 56%; top: 26%; transform: rotate(48deg); }
	.leaf.e { left: 8%; top: 34%; transform: rotate(-60deg); }
	.dim { inset: 0; background: linear-gradient(90deg, rgb(32 22 18 / 0.86) 0%, rgb(32 22 18 / 0.62) 34%, rgb(32 22 18 / 0.18) 62%, rgb(32 22 18 / 0.38) 100%); }
	.vignette { inset: 0; background: radial-gradient(ellipse 90% 80% at 50% 45%, transparent 55%, rgb(20 14 11 / 0.6)); }
	.grain { inset: 0; opacity: 0.35; background-image: radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px); background-size: 3px 3px; }

	/* Narrow containers: a simplified band. */
	@container (max-width: 760px) {
		.shelf, .plant, .rug, .throw, .vignette { display: none; }
		.window { left: -8%; width: 60%; height: 80%; }
		.curtain.l { left: -12%; }
		.curtain.r { left: 50%; }
		.chair { left: 52%; top: 40%; width: 52%; height: 52%; }
		.table { left: 34%; width: 18%; }
		.books { left: 35%; width: 16%; }
		.journal { left: 37%; width: 10%; }
		.cup { left: 46%; width: 3%; }
		.lampglow { left: 56%; top: 6%; width: 60%; height: 70%; }
		.lamp { left: 86%; top: 22%; height: 70%; }
		.shade { left: 79%; top: 14%; width: 16%; }
		.dim { background: linear-gradient(180deg, rgb(32 22 18 / 0.5) 0%, rgb(32 22 18 / 0.72) 100%); }
	}
	@keyframes sceneIn { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: none; } }
	@media (prefers-reduced-motion: reduce) { .scene { animation: none; } }
</style>
