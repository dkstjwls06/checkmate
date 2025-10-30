import { Chess } from './Chess';
const container = document.querySelector('#container');
const tac = document.querySelector('#tac') as HTMLAudioElement;
const coin = document.querySelector('#coin') as HTMLAudioElement;
const cur = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
for(let i = 0; i < 8; i++){
    const div2 = document.createElement('div');
    for(let j = 0; j < 8; j++){
        const alpha = String.fromCharCode(97 + j);
        const div = document.createElement('div');
        div.dataset.pos = `${alpha}${8 - i}`;
        div.classList.add('chess');
        div.classList.add(`x${i % 2 ^ j % 2}`);
        div2.appendChild(div);
    }
    container.appendChild(div2);
}
cur.renderAll();
container.addEventListener('click', e => {
    const tar = e.target as HTMLDivElement;
    const par = e.currentTarget as HTMLDivElement;
    cur.renderAll();
    if(tar.classList.contains('chess') && (par.classList.contains('pick') || cur.isMove(tar.dataset.piece))){
        if(par.classList.contains('pick')){
            const sel = document.querySelector('div.sel') as HTMLDivElement;
            if(tar !== sel && tar.classList.contains('active')){
                const posStart = sel.dataset.pos;
                const posEnd = tar.dataset.pos;
                if(cur.movePiece(posStart, posEnd)){
                    coin.play();
                } else {
                    tac.play();
                }
                cur.renderAll();
            }
            document.querySelectorAll('div.active').forEach((v:HTMLDivElement) => v.classList.remove('active'));
            sel.classList.remove('sel');
            par.classList.remove('pick');
        } else {
            const set = cur.moveGenerator(tar.dataset.pos);
            for(let i of set){
                document.querySelector(`[data-pos="${i}"]`).classList.add('active');
            }
            par.classList.add('pick');
            tar.classList.add('sel');
        }
    }
});