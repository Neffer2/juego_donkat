const VELOCITY = 480;
const TARGET_SCORE = 150;
const GAME_TIME = 40;

// Useful vars
let width, height, mContext, floor, player, elemsFall = [],
    scoreText, timeText, elemsInterval, time = GAME_TIME, timeInterval,
    loose = false, gameOver = false,
    elemsKeys = ['producto'];

// Movements
let goRight = false, goLeft = false, leftBtn, rightBtn, jumpBtn, jump = false;

// Estado de animación
let isEating = false;
let eatTimer = null;

// ---- Nuevos: efectos y partículas ----
let particlesEat, particlesTrail, particlesConfetti, sparkleEmitter;
let scorePopupGroup;
let bgClouds = [];
let lastTrailTime = 0;
let timeWarningTween = null;
let playerShadow;
let comboCount = 0;
let comboTimer = null;
let comboText;
let screenShakeOn = true;

export class Game extends Phaser.Scene {
    constructor () {
        super('Game');
    }

    create(){
        mContext = this;

        // -------- CONTROLES TÁCTILES --------
        leftBtn.on('pointerdown', function(){
            leftBtn.setScale(1.1);
            goLeft = true;
        });
        leftBtn.on('pointerup', function(){ goLeft = false; });
        leftBtn.on('pointerout', () => { leftBtn.setScale(1); goLeft = false; });

        rightBtn.on('pointerdown', function(){
            rightBtn.setScale(1.1);
            goRight = true;
        });
        rightBtn.on('pointerup', function(){ goRight = false; });
        rightBtn.on('pointerout', () => { rightBtn.setScale(1); goRight = false; });

        jumpBtn.on('pointerdown', function(){
            jumpBtn.setScale(1.1);
            jump = true;
        });
        jumpBtn.on('pointerup', function(){ jump = false; });
        jumpBtn.on('pointerout', () => { jumpBtn.setScale(1); jump = false; });

        // -------- CREAR TEXTURAS DE PARTÍCULAS POR CÓDIGO --------
        this.createParticleTextures();

        // -------- TIME --------
        timeInterval = setInterval(() => {
            if (gameOver) return;
            time -= 1;
            let minutes = Math.floor(time / 60);
            let seconds = time % 60;
            timeText.setText(minutes + '0:' + (seconds < 10 ? '0' + seconds : seconds));

            // Pulso rojo cuando queda poco tiempo
            if (time <= 10 && !timeWarningTween) {
                timeText.setColor('#ff3333');
                timeWarningTween = this.tweens.add({
                    targets: timeText,
                    scale: { from: 1, to: 1.3 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
            }

            if (time <= 0){
                clearInterval(timeInterval);
                clearInterval(elemsInterval);
                gameOver = true;
                if (timeWarningTween) timeWarningTween.stop();
                mContext.popUp(false);
            }
        }, 1000);

        // -------- ELEMENTOS QUE CAEN --------
        elemsInterval = setInterval(() => {
            if (gameOver) return;
            this.spawnProduct();
        }, 900);

        // -------- COLLIDERS --------
        this.physics.add.collider(player, floor);
        this.physics.add.overlap(player, elemsFall, this.hitElem, null, this);

        // -------- ANIMACIONES DEL GATO --------
        if (!player.anims.exists('iddle')) {
            player.anims.create({
                key: 'iddle',
                frames: this.anims.generateFrameNumbers('player_iddle', { start: 0, end: 11 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!player.anims.exists('run')) {
            player.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 11 }),
                frameRate: 15,
                repeat: -1
            });
        }
        if (!player.anims.exists('eat')) {
            player.anims.create({
                key: 'eat',
                frames: this.anims.generateFrameNumbers('player_eat', { start: 0, end: 16 }),
                frameRate: 14,
                repeat: 0
            });
        }

        player.anims.play('iddle', true);

        // -------- PARTÍCULAS --------
        // Estela al correr
        particlesTrail = this.add.particles(0, 0, 'dust', {
            lifespan: 400,
            speed: { min: 20, max: 80 },
            angle: { min: 240, max: 300 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.7, end: 0 },
            quantity: 1,
            frequency: -1,
            blendMode: 'ADD'
        });
        particlesTrail.setDepth(0);
        particlesTrail.stop();

        // Explosión al comer
        particlesEat = this.add.particles(0, 0, 'star', {
            lifespan: 600,
            speed: { min: 100, max: 300 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            rotate: { min: 0, max: 360 },
            quantity: 18,
            emitting: false,
            blendMode: 'ADD'
        });
        particlesEat.setDepth(15);

        // Destellos continuos alrededor del gato
        sparkleEmitter = this.add.particles(0, 0, 'star', {
            lifespan: 800,
            speed: { min: 5, max: 20 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 },
            quantity: 1,
            frequency: 250,
            blendMode: 'ADD'
        });
        sparkleEmitter.setDepth(2);
        sparkleEmitter.startFollow(player);

        // Confetti en victoria
        particlesConfetti = this.add.particles(0, 0, 'confetti', {
            lifespan: 3000,
            speed: { min: 200, max: 500 },
            angle: { min: 200, max: 340 },
            gravityY: 400,
            scale: { start: 1, end: 0.5 },
            rotate: { min: 0, max: 360 },
            tint: [0xff006e, 0xffbe0b, 0xfb5607, 0x8338ec, 0x3a86ff, 0x06d6a0],
            quantity: 6,
            frequency: 80,
            emitting: false
        });
        particlesConfetti.setDepth(50);

        // Combo text
        comboText = this.add.text(width/2, height/2 - 200, '', {
            font: '60px primary-font', fill: '#ffcc00',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(20).setAlpha(0);

        // -------- EVENTOS ANIMACIÓN --------
        player.on('animationcomplete', (anim) => {
            if (anim.key === 'eat' && !gameOver) {
                isEating = false;
                if (player.body.touching.down) player.anims.play('iddle', true);
            }
        });
    }

    // ============================================
    // TEXTURAS GENERADAS POR CÓDIGO
    // ============================================
    createParticleTextures() {
        // Polvo
        if (!this.textures.exists('dust')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1);
            g.fillCircle(8, 8, 8);
            g.generateTexture('dust', 16, 16);
            g.destroy();
        }

        // Estrella
        if (!this.textures.exists('star')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffee55, 1);
            g.beginPath();
            g.moveTo(12, 0);
            g.lineTo(15, 9);
            g.lineTo(24, 9);
            g.lineTo(17, 15);
            g.lineTo(20, 24);
            g.lineTo(12, 18);
            g.lineTo(4, 24);
            g.lineTo(7, 15);
            g.lineTo(0, 9);
            g.lineTo(9, 9);
            g.closePath();
            g.fillPath();
            g.generateTexture('star', 24, 24);
            g.destroy();
        }

        // Confetti (rectángulo)
        if (!this.textures.exists('confetti')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 8, 12);
            g.generateTexture('confetti', 8, 12);
            g.destroy();
        }

        // Nube
        if (!this.textures.exists('cloud')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1);
            g.fillCircle(30, 30, 25);
            g.fillCircle(60, 30, 30);
            g.fillCircle(90, 30, 25);
            g.fillRect(30, 30, 60, 25);
            g.generateTexture('cloud', 120, 60);
            g.destroy();
        }
    }

    // ============================================
    // SPAWN DE PRODUCTOS CON EFECTOS
    // ============================================
    spawnProduct() {
        const x = Phaser.Math.Between(30, width - 30);
        const elem = this.physics.add.sprite(x, -50, elemsKeys[0])
            .setScale(.1)
            .setDepth(3);

        // Animación de entrada: "pop" scale
        this.tweens.add({
            targets: elem,
            scale: { from: 0, to: 0.1 },
            duration: 300,
            ease: 'Back.easeOut'
        });

        // Rotación
        elem.setAngularVelocity(Phaser.Math.Between(-200, 200));

        // Partículas al aparecer
        sparkleEmitter.emitParticleAt(x, 0, 6);

        elem.setSize(0, 20, true);
        elemsFall.push(elem);

        // Auto-destruir si cae fuera de pantalla
        elem.checkWorldBounds = true;
        elem.outOfBoundsKill = true;
        elem.once('outOfBounds', () => {
            const idx = elemsFall.indexOf(elem);
            if (idx !== -1) elemsFall.splice(idx, 1);
            elem.destroy();
        });
    }

    update(time){
        if (playerShadow && player) {
            playerShadow.x = player.x;
            // La sombra se "achica" si el gato salta (efecto de altura)
            const groundY = height - 195;
            const distToGround = Math.max(0, groundY - player.y);
            const shadowScale = Phaser.Math.Clamp(1 - distToGround / 800, 0.3, 1);
            playerShadow.setScale(shadowScale);
            playerShadow.setAlpha(0.4 * shadowScale);
        }

        if (loose || isEating || gameOver) {
            player.setVelocityX(0);
            elemsFall.forEach(elem => {
                if (elem.body) {
                    elem.setAngularVelocity(Phaser.Math.RadToDeg(elem.body.velocity.y / 225));
                }
            });
            return;
        }

        // -------- MOVIMIENTO HORIZONTAL --------
        if (goLeft){
            player.setVelocityX(-VELOCITY);
            player.flipX = false;
            player.anims.play('run', true);
            this.emitTrail(time);
        } else if (goRight){
            player.setVelocityX(VELOCITY);
            player.flipX = true;
            player.anims.play('run', true);
            this.emitTrail(time);
        } else {
            player.setVelocityX(0);
            player.anims.play('iddle', true);
        }

        // -------- SALTO --------
        if (jump && player.body.touching.down){
            player.setVelocityY(-VELOCITY);
            player.anims.play('iddle', true);
            // Efecto de salto
            this.cameras.main.shake(80, 0.003);
            particlesTrail.emitParticleAt(player.x, player.y + 100, 8);
        }

        // -------- ROTACIÓN DE ELEMENTOS --------
        elemsFall.forEach(elem => {
            if (elem.body) {
                elem.setAngularVelocity(Phaser.Math.RadToDeg(elem.body.velocity.y / 225));
            }
        });
    }

    emitTrail(time) {
        if (time - lastTrailTime > 60) {
            particlesTrail.emitParticleAt(player.x, player.y + 120, 1);
            lastTrailTime = time;
        }
    }

    init(){
        width = this.game.config.width;
        height = this.game.config.height;

        // Reset de estado
        time = GAME_TIME;
        gameOver = false;
        loose = false;
        isEating = false;
        elemsFall = [];
        comboCount = 0;
        if (eatTimer) { clearTimeout(eatTimer); eatTimer = null; }
        if (comboTimer) { clearTimeout(comboTimer); comboTimer = null; }
        if (timeWarningTween) { timeWarningTween.stop(); timeWarningTween = null; }

        // -------- FONDO CON PARALLAX --------
        this.add.image(0, 0, 'background').setOrigin(0);

        // Nubes de fondo animadas (si existe la textura)
        if (this.textures.exists('cloud')) {
            for (let i = 0; i < 5; i++) {
                const cloud = this.add.image(
                    Phaser.Math.Between(0, width),
                    Phaser.Math.Between(80, 300),
                    'cloud'
                )
                .setAlpha(0.3)
                .setScale(Phaser.Math.FloatBetween(0.5, 1.2))
                .setDepth(0.1)
                .setScrollFactor(0.5);

                bgClouds.push(cloud);

                this.tweens.add({
                    targets: cloud,
                    x: { from: -150, to: width + 150 },
                    duration: Phaser.Math.Between(15000, 25000),
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 5000)
                });
            }
        }

        // -------- SUELO --------
        floor = this.physics.add.staticGroup();
        floor.create(15, (height - 190), '').setSize(width, 20).setOffset(0, 20).setAlpha(0.001);

        // -------- BOTONES TÁCTILES --------
        leftBtn = this.add.image(110, height - 120, 'left-btn').setInteractive().setDepth(1);
        rightBtn = this.add.image(leftBtn.x + 200, leftBtn.y, 'left-btn').setInteractive().setDepth(1);
        rightBtn.setFlipX(true);
        jumpBtn = this.add.image(rightBtn.x + 280, leftBtn.y, 'jump-btn').setInteractive().setDepth(1);

        // Tween de "respiración" en los botones
        [leftBtn, rightBtn, jumpBtn].forEach((btn, i) => {
            this.tweens.add({
                targets: btn,
                scale: { from: 1, to: 1.03 },
                duration: 1200,
                yoyo: true,
                repeat: -1,
                delay: i * 200,
                ease: 'Sine.easeInOut'
            });
        });

        // -------- JUGADOR --------
        player = this.physics.add.sprite((width/2), height - 400, 'player_iddle', 0).setScale(.5);
        player.setSize(300, 620, true).setOffset(80, 100);
        player.body.checkCollision.left = false;
        player.body.checkCollision.right = false;
        player.score = 0;
        player.setCollideWorldBounds(true);

        // Sombra del jugador
        playerShadow = this.add.ellipse(player.x, height - 195, 100, 25, 0x000000, 0.4).setDepth(0.5);

        let scoreBg = this.add.image((width/2) - 150, 80, 'score-bg').setDepth(1);
        let timeBg  = this.add.image((width/2) + 150, 80, 'time-bg').setDepth(1);

        scoreText = this.add.text(scoreBg.x - 60, 60, '0 PTS', {
            font: '30px primary-font',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 6
        }).setDepth(1);

        timeText = this.add.text(timeBg.x - 55, 60, '00:00', {
            font: '30px primary-font',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 6
        }).setDepth(1);
    }

    getRandomNumber(min, max){
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // ============================================
    // COLISIÓN CON PRODUCTO: EFECTOS Y COMBOS
    // ============================================
    hitElem(player, elem){
        if (loose || gameOver) return;

        player.score += 5;
        scoreText.setText(player.score + " PTS");

        // ---- Combo ----
        comboCount++;
        if (comboTimer) clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
            comboCount = 0;
            comboText.setAlpha(0);
        }, 2000);

        if (comboCount >= 3) {
            comboText.setText(`COMBO x${comboCount}!`);
            comboText.setAlpha(1).setScale(0.5);
            this.tweens.add({
                targets: comboText,
                scale: 1.2,
                duration: 300,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: comboText,
                        alpha: 0,
                        duration: 800,
                        delay: 400
                    });
                }
            });
        }

        // ---- Partículas de explosión ----
        particlesEat.emitParticleAt(elem.x, elem.y, 18);

        // ---- Score popup flotante ----
        this.showScorePopup(elem.x, elem.y, '+5');

        // ---- Screen shake sutil ----
        if (screenShakeOn) this.cameras.main.shake(100, 0.004);

        // ---- Flash blanco del gato ----
        player.setTint(0xffffaa);
        this.time.delayedCall(80, () => {
            if (player && player.active) player.clearTint();
        });

        // ---- Eliminar el producto ----
        elemsFall.splice(elemsFall.indexOf(elem), 1);
        elem.destroy();

        // ---- ¿Llegó al objetivo? ----
        if (player.score >= TARGET_SCORE){
            gameOver = true;
            clearInterval(timeInterval);
            clearInterval(elemsInterval);
            mContext.deleteElems();
            this.eatAnimation();
            this.celebrateVictory();
            setTimeout(() => { if (mContext) mContext.popUp(true); }, 1400);
            return;
        }

        this.eatAnimation();
    }

    showScorePopup(x, y, text) {
        const t = this.add.text(x, y, text, {
            font: 'bold 32px Arial',
            fill: '#ffee00',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(25);

        this.tweens.add({
            targets: t,
            y: y - 80,
            alpha: 0,
            scale: 1.5,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => t.destroy()
        });
    }

    celebrateVictory() {
        // Confetti
        particlesConfetti.emitParticleAt(width / 2, 0, 100);
        // Ráfagas desde los lados
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 150, () => {
                particlesConfetti.emitParticleAt(
                    Phaser.Math.Between(0, width),
                    Phaser.Math.Between(0, 100),
                    20
                );
            });
        }
        // Flash de cámara
        this.cameras.main.flash(400, 255, 255, 200);
    }

    eatAnimation(){
        if (isEating) return;
        isEating = true;
        player.setVelocityX(0);
        player.anims.play('eat', true);

        // Fallback por si `animationcomplete` no dispara (por si acaso)
        if (eatTimer) clearTimeout(eatTimer);
        eatTimer = setTimeout(() => {
            if (isEating && !gameOver) {
                isEating = false;
                if (player.body.touching.down) player.anims.play('iddle', true);
            }
        }, 1400);
    }

    popUp(win = false){
        clearInterval(timeInterval);
        clearInterval(elemsInterval);
        if (eatTimer) clearTimeout(eatTimer);
        mContext.deleteElems();

        // Pausar partículas de fondo
        if (particlesTrail) particlesTrail.stop();
        if (sparkleEmitter) sparkleEmitter.stop();

        // -------- OVERLAY OSCURO --------
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 1)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(100);
        overlay.alpha = 0;
        this.tweens.add({
            targets: overlay,
            alpha: 0.9,
            duration: 400,
            ease: 'Sine.easeOut'
        });

        // -------- LOGO (más arriba) --------
        let title = this.add.image(width/2, (height/4) - 40, 'title-score')
            .setDepth(101)
            .setScale(1.2);
        this.tweens.add({
            targets: title,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut',
            delay: 300
        });
        const fxShadow = title.preFX.addShadow(0, 0, 0.006, 2, 0x333333, 10);

        // -------- CABECERA (GANASTE / SE ACABÓ EL TIEMPO) --------
        let headerText = win ? "GANASTE!" : "SE ACABO EL TIEMPO!";

        let score1 = this.add.text((width/2), (height/2) - 120, headerText, {
            font: '42px primary-font',
            fill: win ? '#00cb9b' : '#FFDE00',
            align: 'center',
            stroke: '#000',
            strokeThickness: 7
        }).setOrigin(0.5).setDepth(101).setScale(0);

        this.tweens.add({
            targets: score1,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut',
            delay: 500
        });

        // -------- "LLEVAS" --------
        let score1b = this.add.text((width/2), (height/2) - 50, "CONSEGUISTE", {
            font: '38px primary-font',
            fill: '#FFDE00',
            align: 'center',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(101).setAlpha(0);

        this.tweens.add({ targets: score1b, alpha: 1, duration: 300, delay: 700 });

        // -------- NÚMERO GRANDE DEL PUNTAJE --------
        let score = this.add.text((width/2), (height/2) + 60, '0', {
            font: '140px primary-font',
            fill: '#fff',
            align: 'center',
            stroke: '#000',
            strokeThickness: 10
        }).setOrigin(0.5).setDepth(101);

        // Contador animado
        const scoreProxy = { val: 0 };
        this.tweens.add({
            targets: scoreProxy,
            val: player.score,
            duration: 800,
            delay: 600,
            onUpdate: () => {
                score.setText(Math.floor(scoreProxy.val));
            }
        });

        // -------- "PUNTOS" --------
        let score2 = this.add.text((width/2), (score.y) + 120, "PUNTOS", {
            font: '38px primary-font',
            fill: '#FFDE00',
            align: 'center',
            stroke: '#000',
            strokeThickness: 7
        }).setOrigin(0.5).setDepth(101).setAlpha(0);

        this.tweens.add({ targets: score2, alpha: 1, duration: 400, delay: 900 });

        // -------- META (solo victoria) --------
        if (win) {
            const meta = this.add.text((width/2), (score2.y) + 60,
                `Meta: ${TARGET_SCORE} pts en ${GAME_TIME}s`, {
                    font: '24px primary-font',
                    fill: '#aaa',
                    align: 'center',
                    stroke: '#000',
                    strokeThickness: 4
                }).setOrigin(0.5).setDepth(101).setAlpha(0);
            this.tweens.add({ targets: meta, alpha: 1, duration: 400, delay: 1100 });
        }

        // -------- Animación de respiración del logo --------
        this.add.tween({
            targets: title,
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            delay: 800
        });

        this.add.tween({
            targets: fxShadow,
            x: 2,
            y: -2,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // -------- Confetti en victoria --------
        if (win && particlesConfetti) {
            particlesConfetti.start();
            this.time.delayedCall(3000, () => {
                if (particlesConfetti) particlesConfetti.stop();
            });
        }
    }

    deleteElems(){
        elemsFall.forEach(elem => {
            elem.disableBody(false, false);
        });
    }
}