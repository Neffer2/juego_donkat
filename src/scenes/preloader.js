export class Preloader extends Phaser.Scene {
    constructor ()
    {
        super('Preloader');
    }

    preload ()
    {
        this.load.setPath('public/assets');
        /* PLAYER */
        this.load.spritesheet('player_iddle', './animaciones/iddle.png', { frameWidth: 384, frameHeight: 341.333 });
        this.load.spritesheet('player_run', './animaciones/run.png', { frameWidth: 384, frameHeight: 341.333 });
        this.load.spritesheet('player_eat', './animaciones/eat.png', { frameWidth: 384, frameHeight: 256 });

        /* ELEMS */
        this.load.image('background', './elems/bg.png');
        this.load.image('score-bg', './elems/score_bg.png');
        this.load.image('lives-bg', './elems/lives_bg.png');
        this.load.image('time-bg', './elems/time_bg.png');
        
        /* BUTTONS */
        this.load.image('left-btn', './botones/left.png');
        this.load.image('right-btn', './botones/right.png');
        this.load.image('jump-btn', './botones/jump.png');

        /* TUTORIAL */
        this.load.image('background_tutorial', './tutorial/bg_tutorial.png');
        this.load.image('aceptar-btn', './tutorial/aceptar_btn.png');
        this.load.image('volver-btn', './tutorial/volver_btn.png');
        this.load.image('title', './tutorial/title.png');
        this.load.image('tutorial', './tutorial/tutorial.png');

        /* POPUP */
        this.load.image('title-score', './popup/title_score.png');
        this.load.image('title-footer', './popup/socore_footer.png');

        this.load.image('producto', './elems/producto.png');
    }

    create ()
    {
        // this.scene.start('Game');
        this.scene.start('Tutorial');
    } 
}