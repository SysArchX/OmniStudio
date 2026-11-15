import type { AnimId, EnvId } from "./types";

export const VIDEO_W = 720;
export const VIDEO_H = 1280;

interface Palette {
  sky: [string, string];
  ground: string;
  accent: string;
  detail: string;
}

const PALETTES: Record<EnvId, Palette> = {
  jungle_quicksand: { sky: ["#12301f", "#0a1a12"], ground: "#3a2a14", accent: "#9ccf5b", detail: "#204a30" },
  deep_ocean: { sky: ["#082a44", "#04121f"], ground: "#0b3d5c", accent: "#5fd0e0", detail: "#0d5b7a" },
  urban_storm: { sky: ["#1b1d24", "#0a0b0e"], ground: "#15171c", accent: "#b9c4d6", detail: "#2a2e37" },
  arctic_snow: { sky: ["#9fc3d8", "#4a6b80"], ground: "#e7f2f8", accent: "#8fd0ef", detail: "#c3dbe8" },
  minimal_studio: { sky: ["#141418", "#0b0b0e"], ground: "#1a1a20", accent: "#e4e4e7", detail: "#26262e" },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeOut = (p: number) => 1 - Math.pow(1 - clamp(p, 0, 1), 3);

function background(ctx: CanvasRenderingContext2D, env: EnvId, t: number) {
  const palette = PALETTES[env];
  const sky = ctx.createLinearGradient(0, 0, 0, VIDEO_H);
  sky.addColorStop(0, palette.sky[0]);
  sky.addColorStop(1, palette.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIDEO_W, VIDEO_H);

  const horizon = VIDEO_H * 0.72;
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, horizon, VIDEO_W, VIDEO_H - horizon);

  if (env === "jungle_quicksand") {
    ctx.fillStyle = palette.detail;
    for (let index = 0; index < 9; index += 1) {
      const x = (index * 97 + 40) % VIDEO_W;
      const height = 180 + ((index * 53) % 160);
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.quadraticCurveTo(x + 26, horizon - height * 0.7, x + 52, horizon);
      ctx.fill();
    }
    ctx.fillStyle = "#6b5124";
    ctx.beginPath();
    ctx.ellipse(VIDEO_W / 2, horizon + 120, 250, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7d5f2b";
    for (let index = 0; index < 5; index += 1) {
      const angle = t * 0.6 + index;
      ctx.beginPath();
      ctx.arc(VIDEO_W / 2 + Math.cos(angle) * (60 + index * 18), horizon + 120 + Math.sin(angle) * 12, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (env === "deep_ocean") {
    ctx.fillStyle = palette.detail;
    for (let index = 0; index < 4; index += 1) {
      const y = horizon - 260 + index * 70 + Math.sin(t * 0.8 + index) * 8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= VIDEO_W; x += 60) {
        ctx.quadraticCurveTo(x + 30, y + Math.sin((x + t * 60) / 90) * 14, x + 60, y);
      }
      ctx.lineTo(VIDEO_W, y + 40);
      ctx.lineTo(0, y + 40);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(160, 220, 240, 0.22)";
    for (let index = 0; index < 14; index += 1) {
      const x = (index * 61) % VIDEO_W;
      const y = VIDEO_H - ((t * 34 + index * 90) % 900);
      ctx.beginPath();
      ctx.arc(x, y, 3 + (index % 4), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (env === "urban_storm") {
    ctx.fillStyle = palette.detail;
    for (let index = 0; index < 10; index += 1) {
      const width = 60 + ((index * 37) % 50);
      const height = 180 + ((index * 71) % 320);
      ctx.fillRect(index * 76 - 20, horizon - height, width, height);
    }
    ctx.strokeStyle = "rgba(200, 214, 230, 0.35)";
    ctx.lineWidth = 2;
    for (let index = 0; index < 60; index += 1) {
      const x = (index * 53 + t * 420) % VIDEO_W;
      const y = (index * 97 + t * 900) % VIDEO_H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6, y + 26);
      ctx.stroke();
    }
  } else if (env === "arctic_snow") {
    ctx.fillStyle = palette.detail;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let x = 0; x <= VIDEO_W; x += 80) {
      ctx.lineTo(x, horizon - 90 - Math.sin((x + 40) / 120) * 70);
    }
    ctx.lineTo(VIDEO_W, horizon);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (let index = 0; index < 46; index += 1) {
      const x = (index * 37 + Math.sin(t + index) * 24) % VIDEO_W;
      const y = (index * 61 + t * 46) % VIDEO_H;
      ctx.beginPath();
      ctx.arc(x, y, 2 + (index % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < VIDEO_W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIDEO_H);
      ctx.stroke();
    }
    for (let y = 0; y < VIDEO_H; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIDEO_W, y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.beginPath();
    ctx.arc(VIDEO_W / 2, VIDEO_H * 0.44, 230, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, VIDEO_H * 0.55, VIDEO_W, VIDEO_H * 0.45);
  return palette;
}

interface Pose {
  hip: number;
  lean: number;
  armA: number;
  armB: number;
  legA: number;
  legB: number;
  headTilt: number;
  sink: number;
  curl: number;
}

function poseFor(anim: AnimId, local: number): Pose {
  const cycle = local % 1;
  const wave = Math.sin(local * 7);
  const base: Pose = { hip: 0, lean: 0, armA: 0.6, armB: 0.6, legA: 0.15, legB: -0.15, headTilt: 0, sink: 0, curl: 0 };

  switch (anim) {
    case "running_panic":
      return {
        ...base,
        hip: Math.abs(Math.sin(local * 11)) * 26,
        lean: -0.22,
        armA: -2.1 + wave * 0.35,
        armB: -1.9 - wave * 0.35,
        legA: Math.sin(local * 12) * 0.9,
        legB: -Math.sin(local * 12) * 0.9,
        headTilt: wave * 0.1,
      };
    case "sinking_struggle":
      return {
        ...base,
        sink: clamp(local * 78, 0, 300),
        armA: -2.4 + wave * 0.5,
        armB: -2.2 - wave * 0.5,
        legA: 0.3 + wave * 0.4,
        legB: -0.3 - wave * 0.4,
        headTilt: wave * 0.08,
      };
    case "floating_calm":
      return {
        ...base,
        sink: Math.sin(local * 1.4) * 22,
        armA: -1.1 + Math.sin(local * 1.2) * 0.14,
        armB: 1.1 - Math.sin(local * 1.2) * 0.14,
        legA: 0.2,
        legB: -0.2,
        headTilt: Math.sin(local) * 0.05,
      };
    case "curled_protect":
      return { ...base, curl: 1, hip: 40, armA: -2.3, armB: -2.5, legA: 1.2, legB: 1.1, headTilt: 0.28 };
    case "impact_xray":
      return {
        ...base,
        curl: clamp(1 - cycle * 1.6, 0, 1),
        lean: -0.3 + cycle * 0.7,
        armA: -1.4 - cycle * 0.7,
        armB: 1.4 + cycle * 0.7,
        legA: 0.5 + cycle * 0.4,
        legB: -0.5 - cycle * 0.4,
        sink: cycle * 40,
      };
    case "victory_safe":
      return {
        ...base,
        hip: Math.abs(Math.sin(local * 5)) * 18,
        armA: -2.7 + Math.sin(local * 5) * 0.14,
        armB: -2.5 - Math.sin(local * 5) * 0.14,
        legA: 0.1,
        legB: -0.1,
        headTilt: -0.05,
      };
    default:
      return base;
  }
}

function character(ctx: CanvasRenderingContext2D, anim: AnimId, local: number, accent: string) {
  const pose = poseFor(anim, local);
  const groundY = VIDEO_H * 0.74;
  const scale = 1.05;
  const hipX = VIDEO_W / 2;
  const hipY = groundY - 210 * scale + pose.hip - pose.sink;

  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(pose.lean * 0.25);

  const limb = (angle: number, length: number, width: number, color: string) => {
    const x = Math.sin(angle) * length;
    const y = Math.cos(angle) * length;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
    return { x, y };
  };

  const bodyColor = "#f4f6f8";
  const shadow = "rgba(0,0,0,0.35)";

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, groundY - hipY, 92, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // legs
  ctx.save();
  ctx.strokeStyle = "#dbe2ea";
  ctx.lineWidth = 17;
  ctx.lineCap = "round";
  const legLength = 118 * scale * (1 - pose.curl * 0.25);
  [pose.legA, pose.legB].forEach((angle) => {
    const kneeX = Math.sin(angle) * legLength * 0.55;
    const kneeY = Math.cos(angle) * legLength * 0.55;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(kneeX, kneeY);
    ctx.stroke();
    const shin = angle > 0 ? angle * 0.35 : angle * 1.2;
    ctx.beginPath();
    ctx.moveTo(kneeX, kneeY);
    ctx.lineTo(kneeX + Math.sin(shin) * legLength * 0.5, kneeY + Math.cos(shin) * legLength * 0.5);
    ctx.stroke();
  });
  ctx.restore();

  // torso
  const torsoHeight = (128 - pose.curl * 40) * scale;
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -torsoHeight);
  ctx.stroke();

  const shoulderY = -torsoHeight;
  ctx.save();
  ctx.translate(0, shoulderY);
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 15;
  const armLength = 108 * scale;
  [pose.armA, pose.armB].forEach((angle) => {
    const elbow = Math.sin(angle) * armLength * 0.6;
    const elbowY = Math.cos(angle) * armLength * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(elbow, elbowY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(elbow, elbowY);
    ctx.lineTo(elbow + Math.sin(angle * 0.6) * armLength * 0.45, elbowY + Math.cos(angle * 0.6) * armLength * 0.45);
    ctx.stroke();
  });
  ctx.restore();

  // head
  ctx.save();
  ctx.translate(0, shoulderY - 46 * scale);
  ctx.rotate(pose.headTilt);
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, 40 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#12141a";
  ctx.beginPath();
  ctx.arc(-13, -6, 5.5, 0, Math.PI * 2);
  ctx.arc(13, -6, 5.5, 0, Math.PI * 2);
  ctx.fill();

  const mouthOpen = anim === "running_panic" || anim === "sinking_struggle";
  ctx.strokeStyle = "#12141a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (mouthOpen) {
    ctx.ellipse(0, 15, 13, 15 + Math.abs(Math.sin(local * 8)) * 4, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(0, 12, 12, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  if (anim === "impact_xray") {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    const radius = 80 + (local % 1) * 190;
    ctx.globalAlpha = clamp(1 - (local % 1), 0, 1) * 0.7;
    ctx.beginPath();
    ctx.arc(VIDEO_W / 2, hipY - 90, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  return { hipY };
}

export interface SceneRenderState {
  env: EnvId;
  anim: AnimId;
  local: number;
  elapsed: number;
  accent: string;
}

export function drawScene2D(ctx: CanvasRenderingContext2D, state: SceneRenderState) {
  const palette = background(ctx, state.env, state.elapsed);
  character(ctx, state.anim, state.local, palette.accent);

  if (state.env === "arctic_snow" || state.env === "urban_storm") {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, 0, VIDEO_W, VIDEO_H);
  }

  const vignette = ctx.createRadialGradient(VIDEO_W / 2, VIDEO_H * 0.5, 220, VIDEO_W / 2, VIDEO_H * 0.5, VIDEO_W * 0.98);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIDEO_W, VIDEO_H);
}

export function sceneAccent(env: EnvId) {
  return PALETTES[env].accent;
}

export { easeOut };
