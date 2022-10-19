// PLAYER
const PLAYER_DEFAULT = {
  type: "player",
  name: "player",

  // position/dimensions
  x: 0,
  y: 0,
  prev_x: 0,
  prev_y: 0,
  w: 16,
  h: 16,
  angle: 0,

  // colors
  color: PINK,

  // movement
  speed: 0,
  max_speed: 5,
  direction: 0,
  has_gravity: true,

  // collision
  hit_ground: false,
  hit_ground_last_frame: false,
  hit_wall: false,
  hitboxes: [
    { name: "left", x: 0, y: 0, w: 4, h: 14, color: "red" },
    { name: "right", x: 0, y: 0, w: 4, h: 14, color: "red" },
  ],
  render_hitbox: false,
  enemy_detection_range: 64,

  // physics
  x_velocity: 0,
  y_velocity: 0,
  max_x_velocity: 8,
  max_y_velocity: 8,
  fall_rate: GRAVITY,

  // health/take damage
  i_frames: 30,
  hit: false,
  hp: MAX_HP,

  // powerups
  powerup: "",
  bullet_type: "",

  // animation/vfx
  animation: ANIMATIONS.playerIdle,
  animation_speed: 6,
  state: PLAYER_STATES.IDLE,
  has_trail: true,

  // jump
  jump_height: 0,
  max_jump_height: 128,
  hang_time: 30,
  jumping: false,
  coyote_time: 1,
  coyote_time_counter: 0,
  can_jump: true,

  // test jump
  jumping_this_frame: false,
  landing_this_frame: false,
  velocity: { x: 0, y: 0 },
  raw_movement: 0,
  grounded: false,
  last_position: { x: 0, y: 0 },
  current_h_speed: 0,
  current_v_speed: 0,
  time_left_grounded: 0,
  grounded_check: false,
  coyote_usable: false,
  col_down: false,
  min_fall_speed: 5,
  max_fall_speed: 10,
  fall_speed: 0,
  jump_apex_threshold: 10,
  coyote_time_threshold: 0.1,
  jump_buffer: 0.1,
  jump_end_early_modifier: 3,
  ended_jump_early: true,
  apex_point: 0,
  last_jump_pressed: 0,
  can_use_coyote: false,
  has_buffered_jump: false,

  // shooting/kicking
  shot_timer: 0,
  shot_fired: false,
  kicking: false,
  kick_time: 15,
};

const PLAYER = { ...PLAYER_DEFAULT };

// PLATFORM BLOCKS
const BLOCK = {
  x: 0,
  y: 0,
  block_id: 0,
  angle: 0,
  color: "blue",
  w: UNIT_SIZE,
  h: UNIT_SIZE,
  type: "floor",
  sprite: "platform",
  render_hitbox: false,
  spawn_timer: MAX_PLATFORM_SPAWN_TIMER,
  hitboxes: [
    { name: "top", x: 0, y: 0, w: 16, h: 8, color: "yellow" },
    { name: "left", x: 0, y: 2, w: 2, h: 14, color: "red" },
    { name: "right", x: UNIT_SIZE - 2, y: 2, w: 2, h: 14, color: "red" },
  ],
};

// PROJECTILES
const BULLET = {
  type: "bullet",
  name: "normalShot",
  state: "Move",
  w: 8,
  h: 8,
  x: 0,
  y: 0,
  color: YELLOW,
  life_timer: 60,
  direction: 0,
  speed: 6,
  animation: ANIMATIONS.normalShotMoveLeft,
  has_trail: true,
  render_hitbox: false,
  recoil: 5,
  angle: 0,
};
const RAPID_BULLET = {
  ...BULLET,
  recoil: 10,
  life_timer: 30,
};

const WIDE_BULLET = {
  ...BULLET,
  name: "wideShot",
  state: "Move",
  h: 32,
  w: 32,
  recoil: 8,
  animation: ANIMATIONS.wideShotMoveLeft,
};

const MISSILE_SHOT = {
  ...BULLET,
  x: 0,
  y: 0,
  h: 16,
  w: 16,
  type: "bullet",
  name: "missile",
  state: "Move",
  speed: 4,
  color: YELLOW,
  animation: ANIMATIONS.missileMoveLeft,
  render_hitbox: false,
  has_trail: true,
  recoil: 10,
  has_rotation: true,
  angle: 0,
  exploding: true,
};

const EXPLOSION = {
  type: "explosion",
  x: 0,
  y: 0,
  radius: 1,
  expansion_rate: 0,
  max_radius: 64,
  color: WHITE,
};

// ENEMIES
const ENEMY = {
  type: "enemy",
  name: "enemy",
  w: 16,
  h: 16,
  x: 0,
  y: 0,
  prev_y: 0,
  prev_x: 0,
  color: PINK,
  direction: 0,
  speed: 1,
  fall_rate: GRAVITY / 2,
  has_gravity: true,
  hitboxes: [
    { name: "left", x: 0, y: 0, w: 4, h: 14, color: "blue" },
    { name: "right", x: 0, y: 0, w: 4, h: 14, color: "blue" },
  ],
  hit_ground: false,
  hit_wall: false,
  has_trail: true,
  animation: ANIMATIONS.enemyMoveRight,
  animation_speed: 12,
  movement_direction: "diagnoal",
  spawn_points: [
    { x: 0, y: 3 },
    { x: GAME_W / UNIT_SIZE, y: 3 },
    { x: 0, y: 11 },
  ],
  angle: 0,
  state: "Move",
  points_to_spawn: 0,
  points: 10,
};

const EXPLODING_ENEMY = {
  ...ENEMY,
  name: "explodingEnemy",
  color: VIOLET,
  animation: ANIMATIONS.explodingEnemyMoveDown,
  movement_direction: "vertical",
  speed: 0,
  direction: 90,
  spawn_points: [
    { x: 2, y: 1 },
    { x: 4, y: 1 },
    { x: 6, y: 1 },
    { x: 8, y: 1 },
    { x: 10, y: 1 },
  ],
  exploding: true,
  points_to_spawn: 100,
  points: 15,
};

const ROLLING_ENEMY = {
  ...ENEMY,
  solid: true,
  name: "rollingEnemy",
  w: 32,
  h: 32,
  color: VIOLET,
  animation: ANIMATIONS.rollingEnemyMoveLeft,
  hp: 3,
  render_hitbox: false,
  points_to_spawn: 300,
  points: 25,
};

const BOUNCING_ENEMY = {
  ...ENEMY,
  solid: true,
  name: "bouncingEnemy",
  color: VIOLET,
  animation: ANIMATIONS.bouncingEnemyMoveLeft,
  speed: 3,
  spawn_points: [
    { x: 2, y: 1 },
    { x: 4, y: 1 },
    { x: 6, y: 1 },
    { x: 8, y: 1 },
    { x: 10, y: 1 },
  ],
  points_to_spawn: 200,
  points: 20,
};

const ENEMIES = [ENEMY, EXPLODING_ENEMY, ROLLING_ENEMY, BOUNCING_ENEMY];

// POWERUPS and POINT COLLECTIBLES
const COLLECT = {
  type: "collect",
  w: 32,
  h: 32,
  x: 0,
  y: 0,
  color: "yellow",
  life_timer: 360,
  points: 100,
  pickup: PICKUPS.POINTS,
  render_hitbox: false,
  sprite: "collectible",
  angle: 0,
};

const ROTATING_SHIELD = {
  x: 0,
  y: 0,
  h: 10,
  w: 10,
  type: "shield",
  sprite: "shield",
  speed: 1,
  color: YELLOW,
  render_hitbox: false,
  has_trail: true,
};

const WIDE_SHOT = { ...COLLECT, pickup: PICKUPS.WIDE_SHOT };
const RAPID_FIRE = { ...COLLECT, pickup: PICKUPS.RAPID_FIRE };
const MISSILE = { ...COLLECT, pickup: PICKUPS.MISSILE };
const SHIELD = { ...COLLECT, pickup: PICKUPS.SHIELD };
const HP = { ...COLLECT, pickup: PICKUPS.HP, sprite: "hp_up" };
const COLLECTIBLES = [MISSILE, WIDE_SHOT, RAPID_FIRE, SHIELD, HP, COLLECT];

// BACKGROUNDS FOR PARALLAX
const BACKGROUND_1 = {
  x: 0,
  y: 0,
  speed: 1,
};
const BACKGROUND_2 = {
  x: 0,
  y: 0,
  speed: 2,
};
const BACKGROUND_3 = {
  x: 0,
  y: 0,
  speed: 3,
};

const BACKGROUNDS = [BACKGROUND_1, BACKGROUND_2, BACKGROUND_3];

// TEXT
const TEXT_OBJECT = {
  x: 0,
  y: 0,
  h: 8,
  w: 32,
  color: WHITE,
  text: "test",
  type: "text",
  speed: 1,
  alpha: 1,
};
