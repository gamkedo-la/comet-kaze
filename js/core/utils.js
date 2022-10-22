// GLOBAL UTILS
initializeScores(); // needs to be called early to get score data before game runs

// general
function loopClamp(num, min, max) {
  // when a number exceeds a maximum or goes below a minimum, wrap it back around to the other end of the range
  // idk if 'loopClamp' is the name for this concept lol
  if (num < min) return max;
  if (num > max) return min;
  return num;
}

function clamp(num, min, max) {
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function easing(x, target) {
  return (x += (target - x) * 0.1);
}

function easingWithRate(x, target, rate, tolerance = 0) {
  if (tolerance > 0 && x >= target * tolerance) return easing(x, target);
  return (x += (target - x) * rate);
}

function choose(choices) {
  return choices[Math.floor(Math.random() * choices.length)];
}

function randomInt(min, max) {
  // helper function (inclusive: eg 1,10 may include 1 or 10)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// object positions/tracking
function assignId(obj) {
  if (!obj.id) {
    obj.id = object_id_counter.toString();
    object_id_counter += 1;
  }

  return obj.id;
}

function storePreviousPosition(obj) {
  // If no entry for this object exists, create one (default to array)
  if (!obj.id) {
    assignId(obj);
  }

  if (!object_position_map[obj.id]) {
    object_position_map[obj.id] = [];
  }

  // Store the object's current position in the corresponding array
  object_position_map[obj.id].push({ x: obj.x, y: obj.y });

  // If the position array has exceeded the maximum size, remove the oldest position
  if (object_position_map[obj.id].length > max_position_count) {
    object_position_map[obj.id].shift();
  }
}

// spawning
function spawnObject(obj, x, y) {
  var new_obj = { ...obj };
  new_obj.x = x;
  new_obj.y = y;
  GAME_OBJECTS.push(new_obj);
  return new_obj;
}

function spawnBullet(source, direction, projectile) {
  // Center of bullet source
  var source_center_x = source.x + source.w / 2;
  var source_center_y = source.y + source.h / 2;

  // Bullet to spawn
  var new_bullet = JSON.parse(JSON.stringify({ ...projectile }));

  // Spawn bullet at center of source, with a buffer for the horizontal direction
  new_bullet.x = source_center_x - projectile.w / 2;
  new_bullet.y = source_center_y;

  // Center bullet with source object
  new_bullet.x += source.w * Math.cos((direction * Math.PI) / 180);
  new_bullet.y -= new_bullet.h / 2;

  // Set bullet to move in given direction
  new_bullet.direction = direction;

  // Spawn bullet
  GAME_OBJECTS.push(new_bullet);

  return new_bullet;
}

function spawnEnemy(type = ENEMY) {
  var new_enemy = { ...type };
  var player_center = {
    x: PLAYER.x + PLAYER.w / 2,
    y: PLAYER.y + PLAYER.h / 2,
  };

  // **only spawn enemies outside the detection range of the player**

  // get all spawn points
  let all_spawn_points = new_enemy.spawn_points;

  // filter out points that are within range
  let available_spawn_points = all_spawn_points.filter((point) => {
    var adjusted_current_point = { x: withGrid(point.x), y: withGrid(point.y) };
    return (
      getDistance(adjusted_current_point, player_center) >
      PLAYER.enemy_detection_range
    );
  });

  // pick randomly from remaining points
  chosen_spawn_point = choose(available_spawn_points);

  new_enemy.x = withGrid(chosen_spawn_point.x);
  new_enemy.y = withGrid(chosen_spawn_point.y);

  new_enemy.direction = chosen_spawn_point.direction;

  if (score > 300) {
    new_enemy.speed *= 2;
    new_enemy.fall_rate *= 2;
  }

  GAME_OBJECTS.push(new_enemy);
}

function spawnCollectible() {
  var new_collect = choose(COLLECTIBLES);
  var temp_collect = { ...new_collect };

  // spawn at the location farthest from the player
  var farthest_spawn_point = COLLECTIBLE_LOCATIONS[0];
  COLLECTIBLE_LOCATIONS.forEach((loc) => {
    // have to adjust the spawn location coordinates to match the invisible level grid
    var adjusted_current_loc = { x: withGrid(loc.x), y: withGrid(loc.y) };
    var adjusted_farthest_loc = {
      x: withGrid(farthest_spawn_point.x),
      y: withGrid(farthest_spawn_point.y),
    };

    // compare current distance to our previous farthest distance
    let distance = getDistance(adjusted_current_loc, PLAYER);
    if (distance >= getDistance(adjusted_farthest_loc, PLAYER)) {
      farthest_spawn_point = loc;
    }
  });
  var spawn_point = farthest_spawn_point;

  temp_collect.x = withGrid(spawn_point.x);
  temp_collect.y = withGrid(spawn_point.y);

  GAME_OBJECTS.push(temp_collect);
}

function spawnShield() {
  var new_shield = { ...ROTATING_SHIELD };
  new_shield.x = PLAYER.x;
  new_shield.y = PLAYER.y;
  GAME_OBJECTS.push(new_shield);
  playSoundEffect("shield_hit");
}

// powerups
function checkPlayerPowerup() {
  switch (PLAYER.powerup) {
    case PICKUPS.WIDE_SHOT:
      PLAYER.bullet_type = WIDE_BULLET;
      break;
    case PICKUPS.RAPID_FIRE:
      PLAYER.bullet_type = RAPID_BULLET;
      break;
    case PICKUPS.SHIELD:
      if (!shield_spawned) {
        spawnShield();
        shield_spawned = true;
      }
      break;
    case PICKUPS.MISSILE:
      PLAYER.bullet_type = MISSILE_SHOT;
      break;
    default:
      PLAYER.bullet_type = BULLET;
      break;
  }
}

function checkPickupType(collectible) {
  switch (collectible.pickup) {
    case PICKUPS.HP:
      if (PLAYER.hp < MAX_HP) {
        PLAYER.hp += 1;
      }
      playSoundEffect("heal_hp");
      break;
    case PICKUPS.POINTS:
      score += collectible.points;
      break;
    default:
      break;
  }
}

// level/map
function checkIfOutOfBounds(object) {
  return (
    object.x < 0 ||
    object.x + object.width > GAME_W ||
    object.y < 0 ||
    object.y + object.height > GAME_H
  );
}

function buildMap() {
  BLOCK_MAP.forEach((block, i) => {
    var new_block = { ...BLOCK };
    new_block.block_id = i;
    new_block.x = withGrid(block.x);
    new_block.y = withGrid(block.y);
    GAME_OBJECTS.push(new_block);
  });
}

function withGrid(number) {
  return Math.floor(number * UNIT_SIZE);
}

// physics
function collisionDetected(obj_a, obj_b) {
  return (
    obj_a.x < obj_b.x + obj_b.w &&
    obj_a.x + obj_a.w > obj_b.x &&
    obj_a.y < obj_b.y + obj_b.h &&
    obj_a.y + obj_a.h > obj_b.y
  );
}

function collisionWithCircleDetected(circle, rect) {
  var distX = Math.abs(circle.x - rect.x - rect.w / 2);
  var distY = Math.abs(circle.y - rect.y - rect.h / 2);

  // not colliding
  if (distX > rect.w / 2 + circle.radius) {
    return false;
  }
  if (distY > rect.h / 2 + circle.radius) {
    return false;
  }

  // colliding
  if (distX <= rect.w / 2) {
    return true;
  }
  if (distY <= rect.h / 2) {
    return true;
  }

  //check for collision with rectangle corner
  var dx = distX - rect.w / 2;
  var dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function removeObj(obj) {
  var index = GAME_OBJECTS.indexOf(obj);
  GAME_OBJECTS.splice(index, 1);
}

function getHitbox(object, box_name) {
  if (object.hitboxes) {
    const myBox = object.hitboxes.find((box) => box.name === box_name);

    return myBox ? myBox : null;
  }
}

function updateHitboxes(object) {
  if (object.hitboxes) {
    const left = object.hitboxes.find((box) => box.name === "left");
    const right = object.hitboxes.find((box) => box.name === "right");
    const damage_detection = object.hitboxes.find(
      (box) => box.name === "damage_detection"
    );

    if (damage_detection) {
      damage_detection.x = object.x + object.w / 2 - damage_detection.w / 2;
      damage_detection.y = object.y + object.h / 2 - damage_detection.h / 2;
    }

    if (left && right) {
      left.x = object.x;
      left.y = object.y;

      right.x = object.x + object.w - right.w;
      right.y = object.y;
    }
  }
}

function drawHitboxes(object) {
  object.hitboxes.forEach((box) => {
    context.fillStyle = box.color;
    context.fillRect(box.x, box.y, box.w, box.h);
  });
}

function recoil(object, shot, recoil_amount) {
  object.x -=
    recoil_amount *
    Math.cos((shot.direction * Math.PI) / 180) *
    time_scale *
    game_speed;
  object.y -=
    recoil_amount *
    Math.sin((shot.direction * Math.PI) / 180) *
    time_scale *
    game_speed;
}

function moveInOwnDirection(object) {
  object.prev_x = object.x;
  object.prev_y = object.y;
  object.x +=
    object.speed *
    Math.cos((object.direction * Math.PI) / 180) *
    time_scale *
    game_speed;
  object.y +=
    object.speed *
    Math.sin((object.direction * Math.PI) / 180) *
    time_scale *
    game_speed;
}

function getDistance(obj_a, obj_b) {
  return Math.hypot(obj_a.x - obj_b.x, obj_a.y - obj_b.y);
}

// game state
function resetGame() {
  GAME_OBJECTS.length = 0;
  GAME_OBJECTS.push(PLAYER);
  game_state = STATES.GAME_OVER;
  resetPlayer();
  saveScore(score);
  buildMap();
}

function resetPlayer() {
  const player_keys = Object.keys(PLAYER);
  player_keys.forEach((key) => {
    PLAYER[key] = PLAYER_DEFAULT[key];
  });
}

function startGame() {
  GAME_OBJECTS.push(PLAYER);
  buildMap();
}

// scores
function initializeScores() {
  // RECENT SCORES
  if (window.localStorage.getItem("recent_scores")) {
    recent_scores = JSON.parse(window.localStorage.getItem("recent_scores"));
  } else {
    recent_scores = [];
  }

  // HIGH SCORES
  if (window.localStorage.getItem("high_scores")) {
    high_scores = JSON.parse(window.localStorage.getItem("high_scores"));
  } else {
    high_scores = [];
  }
}

function saveScore(score) {
  // add to list of recent scores
  recent_scores?.push(score);
  if (recent_scores?.length > max_recent_score_list_length) {
    recent_scores?.shift();
  }
  window.localStorage.setItem("recent_scores", JSON.stringify(recent_scores));

  // if no scores are recorded, make first entry in high score array
  if (high_scores.length === 0) {
    high_scores = [score];
    window.localStorage.setItem("high_scores", JSON.stringify(high_scores));
    return;
  }

  // if other scores exist, find a place in the high score array
  for (var i = 0; i < high_scores.length; i++) {
    if (high_scores[i] < score) {
      high_scores.splice(i, 0, score);
      break;
    }
  }

  // if the high score list has exceeded the maximum length, remove the excess scores
  if (high_scores.length > max_high_score_list_length) {
    high_scores.splice(max_high_score_list_length - 1);
  }

  // save high scores
  window.localStorage.setItem("high_scores", JSON.stringify(high_scores));
}

function getAverageScore(scores) {
  var number_of_scores = scores.length;
  var sum = 0;
  for (var i = 0; i < scores.length; i++) {
    sum += scores[i];
  }

  return sum / number_of_scores;
}

// text
function getTextWidth(text) {
  return context.measureText(text).width;
}

function drawCenteredText(text, y_value) {
  context.fillText(text, GAME_W / 2 - getTextWidth(text) / 2, y_value);
}

function setFontSize(size) {
  context.font = size + "px PressStart2P";
}

// vfx/animation
function drawCircleAroundObject(obj, radius, color) {
  let obj_center = { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
  context.fillStyle = color;
  context.beginPath();
  context.arc(obj_center.x, obj_center.y, radius, 0, 2 * Math.PI);
  context.stroke();
}

function getPlayerAnimation() {
  return ANIMATIONS[PLAYER_STATE_TO_ANIMATION[PLAYER.state]];
}

function mapDirectionToString(direction) {
  let map = {
    [0]: "Right",
    [90]: "Down",
    [180]: "Left",
    [270]: "Up",
  };

  return map[direction];
}

function getAnimationDirection(object) {
  let type = object.name;
  let action = object.state;

  // return an animation that has no specific direction
  if (ANIMATIONS[type + action]) {
    return ANIMATIONS[animation_key];
  }

  // return an animation that has a direction
  let direction = mapDirectionToString(object.direction);
  let animation_key = type + action + direction;
  if (ANIMATIONS[animation_key]) {
    return ANIMATIONS[animation_key];
  }

  // if no other animation is available, return the object's default animation
  return object.animation;
}

function getInputAnimation(control) {
  // TODO: fix this to check for the player's current input device
  let first_input_with_animation = control.inputs.find(
    (input) => ANIMATIONS[input]
  );

  return ANIMATIONS[first_input_with_animation];
}

function drawTrail(obj) {
  object_position_map[obj.id]?.forEach((pos, i) => {
    // ratio that moves toward one as we reach the end of the trail
    // useful for gradually increasing size/alpha/etc
    let ratio = (i + 1) / object_position_map[obj.id].length;

    // keep height and width within range of the leading object's size
    let w = clamp(ratio * obj.w, 1, obj.w);
    let h = clamp(ratio * obj.h, 1, obj.h);

    // center trail with leading object
    let x = pos.x;
    let y = pos.y;

    x -= w / 2;
    y -= h / 2;

    x += obj.w / 2;
    y += obj.h / 2;

    // increase alpha as we get closer to the front of the trail
    context.fillStyle = "rgba(255, 255, 255, " + ratio / 2 + ")";
    context.fillRect(x, y, w, h);
  });
}

function lerpColor(a, b, amount) {
  var ah = parseInt(a.replace(/#/g, ""), 16),
    ar = ah >> 16,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff,
    bh = parseInt(b.replace(/#/g, ""), 16),
    br = bh >> 16,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return (
    "#" + (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1)
  );
}

function drawCircleTrail(obj) {
  object_position_map[obj.id]?.forEach((pos, i) => {
    // don't draw the head of the trail
    if (i === object_position_map[obj.id].length - 1) {
      return;
    }

    // ratio that moves toward one as we reach the end of the trail
    // useful for gradually increasing size/alpha/etc
    let ratio = (i + 1) / object_position_map[obj.id].length;

    // center trail with leading object
    let x = pos.x;
    let y = pos.y;

    x += obj.w / 2;
    y += obj.h / 2;

    // add noise to position of particles
    y += Math.sin(game_timer * Math.random()) * 0.5;
    x += Math.sin(game_timer * Math.random()) * 0.5;

    // transition the trail color to the object's own color as we get closer to the front of the trail
    context.fillStyle = lerpColor(WHITE, obj.color, ratio);

    // draw circle
    context.beginPath();
    context.arc(x, y, 5 * ratio, 0, 2 * Math.PI);
    context.fill();
  });
}

function drawParticleTrail(obj) {
  object_position_map[obj.id]?.forEach((pos, i) => {
    // ratio that moves toward one as we reach the end of the trail
    // useful for gradually increasing size/alpha/etc
    let ratio = (i + 1) / object_position_map[obj.id].length;

    // center trail with leading object
    let x = pos.x;
    let y = pos.y;

    // transition the trail color to the object's own color as we get closer to the front of the trail
    context.globalAlpha = ratio;
    context.fillStyle = lerpColor(WHITE, YELLOW, ratio);
    context.fillRect(x, y, 1, 1);
    context.globalAlpha = 1;
  });
}

function explosion(x, y) {
  // sparkle_fx(x, y);
  smoke_fx(x, y);
  // fire_fx(x, y);
  spark_fx(x, y);
  spark_fx(x, y);
  spark_fx(x, y);
  playSoundEffect("explode");
}

function drawBitmapCenteredAtLocationWithRotation(
  graphic,
  atX,
  atY,
  withAngle,
  alpha
) {
  if (!graphic) return;
  context.save(); // allows us to undo translate movement and rotate spin
  context.translate(atX, atY); // sets the point where our graphic will go
  context.rotate(withAngle); // sets the rotation
  if (alpha != undefined) context.globalAlpha = alpha;
  context.drawImage(graphic, -graphic.width / 2, -graphic.height / 2); // center, draw
  if (alpha != undefined) context.globalAlpha = 1;
  context.restore(); // undo the translation movement and rotation since save()
}

function updateScreenshake() {
  if (!screen_shake_on) return;
  if (PLAYER.screenshakesRemaining) {
    // starts max size and gets smaller
    let wobble = Math.round(
      (PLAYER.screenshakesRemaining / PLAYER_HIT_SCREENSHAKES) *
        SCREENSHAKE_MAX_SIZE
    );
    if (PLAYER.screenshakesRemaining % 4 < 2) wobble *= -1; // alternate left/right every 2 frames
    context.setTransform(1, 0, 0, 1, wobble, 0);
    PLAYER.screenshakesRemaining--;
  } else {
    context.setTransform(1, 0, 0, 1, 0, 0); // reset
  }
}

function drawErrorMessage(message) {
  context.fillStyle = WHITE;
  context.fillText(message, GAME_W / 2 - 100, 10);
  context.fillText(ERROR_MESSAGES.CHECK_CONSOLE, GAME_W / 2 - 100, 25);
}

// sound
function setMasterVolume(vol) {
  master_volume = vol;
  localStorage.setItem("master_volume", JSON.stringify(master_volume));
}

function setMusicVolume(vol) {
  music_volume = vol;
  localStorage.setItem("music_volume", JSON.stringify(music_volume));
}

function setSoundEffectVolume(vol) {
  sound_effect_volume = vol;
  localStorage.setItem(
    "sound_effect_volume",
    JSON.stringify(sound_effect_volume)
  );
}

function playMusic(song) {
  let playbackRate = 1;
  let pan = 0;
  let volume = (music_volume / 100) * (master_volume / 10);
  let loop = true;
  let sound = playSound(SOUNDS[song], playbackRate, pan, volume, loop);
  if (sound) {
    song_playing = true;
  }
  return sound;
}

function playSoundEffect(sound_effect) {
  let playbackRate = 1;
  let pan = 0;
  let volume = (sound_effect_volume / 100) * (master_volume / 10);
  let loop = false;
  let sound = playSound(SOUNDS[sound_effect], playbackRate, pan, volume, loop);
  return sound;
}

// options
function toggleFullscreen(value) {
  fullscreen = value;
  if (fullscreen) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// character actions
function jump(obj) {
  // initial jump force
  if (obj.hit_ground) {
    obj.y_velocity += GRAVITY * game_speed * time_scale;
  }

  // check if we reached our maximum jump height
  let reached_max_height = obj.jump_height >= obj.max_jump_height;

  // keep accelerating if we have not reached the max jump height
  if (!reached_max_height) {
    obj.y_velocity =
      easingWithRate(obj.y_velocity, obj.max_y_velocity, 0.4) *
      game_speed *
      time_scale;
    obj.jump_height += obj.y_velocity;
    return;
  }
}

function easeMovement(obj, direction) {
  obj.state = PLAYER_STATES.RUNNING;
  obj.speed = easing(obj.speed, obj.max_speed);
  obj.direction = direction;
  moveInOwnDirection(obj);
}

function screenwrap(obj) {
  if (obj.x + obj.w > GAME_W) {
    obj.x = 0;
  }

  if (obj.x + obj.w < 0) {
    obj.x = GAME_W - obj.w;
  }

  if (obj.y + obj.h > GAME_H) {
    obj.y = 0;
  }

  if (obj.y + obj.h < 0) {
    obj.y = GAME_H - obj.h;
  }
}
