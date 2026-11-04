let arepaHuevo, arepaCarne, arepaMq, startBtn, mContext, tipoArepa = 'arepa-huevo';

export class Menu extends Phaser.Scene {
    constructor ()
    {
        super('Menu');
    }

    create ()
    {
        mContext = this;
        arepaHuevo.on('pointerdown', function(){
            arepaHuevo.setScale(.3);
            setTimeout(() => {
                tipoArepa = 'arepa-huevo';
            }, 350);
        });

        arepaHuevo.on('pointerout', () => {            
            arepaHuevo.setScale(.5); 
        });

        arepaCarne.on('pointerdown', function(){
            arepaCarne.setScale(.3);
            setTimeout(() => {
                tipoArepa = 'arepa-carne';
            }, 350);
        });

        arepaCarne.on('pointerout', () => {            
            arepaCarne.setScale(.5); 
        });

        arepaMq.on('pointerdown', function(){
            arepaMq.setScale(.3);
            setTimeout(() => {
                tipoArepa = 'arepa-mq';
            }, 350);
        });

        arepaMq.on('pointerout', () => {            
            arepaMq.setScale(.5); 
        });

        startBtn.on('pointerdown', function(){
            startBtn.setScale(.65);
            setTimeout(() => {
                mContext.scene.start('Game', {arepa: tipoArepa});
            }, 350);
        });

        startBtn.on('pointerout', () => {            
            startBtn.setScale(.85); 
        });
    }

    init(){
        this.add.image(0, 0, 'background').setOrigin(0);
        this.add.image((this.game.config.width)/2, (this.game.config.height)/2, 'presentaciones2');

        arepaHuevo = this.add.image(((this.game.config.width)/2) + 100, (this.game.config.height) - 380, 'arepa-huevo').setScale(.5).setInteractive();
        arepaCarne = this.add.image(((this.game.config.width)/2) - 90, (this.game.config.height) - 380, 'arepa-carne').setScale(.5).setInteractive();
        arepaMq = this.add.image(((this.game.config.width)/2), (this.game.config.height) - 540, 'arepa-mq').setScale(.5).setInteractive();

        startBtn = this.add.image(((this.game.config.width)/2), (this.game.config.height) - 180, 'start-btn').setScale(.85).setInteractive();
    }
} 