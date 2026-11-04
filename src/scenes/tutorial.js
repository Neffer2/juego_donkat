let width, height, mContext;

export class Tutorial extends Phaser.Scene {
    constructor ()
    {
        super('Tutorial');
    }

    create ()
    {
        mContext = this;

        // -------- FONDO --------
        let bg = this.add.image(0, 0, 'background_tutorial').setOrigin(0, 0);

        // -------- TEXTOS DE INSTRUCCIONES --------
        const textStyle = {
            font: '38px primary-font',
            fill: '#ffffff',
            align: 'center',
            stroke: '#000',
            strokeThickness: 6,
            wordWrap: { width: width * 0.85 }
        };

        // Título
        let title = this.add.text(width/2, height * 0.28, '¿COMO JUGAR?', {
            font: '56px primary-font',
            fill: '#00cb9b',
            align: 'center',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Instrucción principal
        let instruction1 = this.add.text(
            width/2,
            height * 0.42,
            'Muevete de izquierda a derecha\ny recolecta la mayor cantidad de puntos.',
            textStyle
        ).setOrigin(0.5);

        // Meta
        let instruction2 = this.add.text(
            width/2,
            height * 0.56,
            'Tienes 40 segundos para conseguir 140 puntos.',
            {
                ...textStyle,
                fill: '#ffcc00',
                font: '36px primary-font'
            }
        ).setOrigin(0.5);

        // -------- BOTÓN ACEPTAR --------
        let acpetarBtn = this.add.image(width/2, instruction2.y + 200, 'aceptar-btn').setScale(1.3);
        acpetarBtn.setInteractive();

        acpetarBtn.on('pointerdown', function(){
            acpetarBtn.setScale(1.1);
        });

        acpetarBtn.on('pointerup', function(){
            mContext.scene.start('Game');
        });

        acpetarBtn.on('pointerout', () => {
            acpetarBtn.setScale(1);
        });

        // -------- ANIMACIONES DE ENTRADA --------
        // Título con pop
        title.setScale(0);
        this.tweens.add({
            targets: title,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut',
            delay: 100
        });

        // Textos con fade
        instruction1.setAlpha(0);
        this.tweens.add({
            targets: instruction1,
            alpha: 1,
            duration: 400,
            delay: 400
        });

        instruction2.setAlpha(0);
        this.tweens.add({
            targets: instruction2,
            alpha: 1,
            duration: 400,
            delay: 700
        });

        // Botón con fade
        acpetarBtn.setAlpha(0);
        this.tweens.add({
            targets: acpetarBtn,
            alpha: 1,
            duration: 400,
            delay: 1000
        });
    }

    init(){
        width = this.game.config.width;
        height = this.game.config.height;
    }
}