interface KING{
    '-1':[number, number];
    '1':[number, number];
};
interface ChessInter{
    str:string;
    arr:string[][];
    move:'b'|'w';
    castle:string;
    pasang:string;
    half:number;
    full:number;
    king?:KING;
}

interface PieceType{
    v:string;
    ori:[number, number, number, number];
    end:[number, number];
}

export class Chess implements ChessInter{
    str:string;
    arr:string[][];
    move:'b'|'w';
    castle:string;
    pasang:string;
    half:number;
    full:number;
    king:KING;
    static whiteReg = /[KQRBNP]/;
    static blackReg = /[kqrbnp]/;
    static op = {
        '1' : /[KQRBNP]/,
        '-1' : /[kqrbnp]/
    };
    constructor(str:string){
        Object.assign(this, Chess.fenToData(str));
    }
    static fenToData(str:string):ChessInter{
        const [fen, move, castle, pasang, half, full] = str.split(' ');
        const obj:ChessInter = {
            str,
            move: move as 'b'|'w',
            castle,
            arr: [],
            pasang,
            half: Number(half),
            full: Number(full),
            king:{
                '-1': [4, 7],
                '1': [4, 0]
            }
        };
        const fenArr = fen.split('/');
        for(let i of fenArr){
            const temp = [];
            obj.arr.push(temp);
            for(let j of i){
                const t = Number(j);
                if(!isNaN(t)){
                    for(let k = 0; k < t; k++) temp.push('e');
                } else{
                    temp.push(j);
                    const king:[number, number] = [temp.length - 1, obj.arr.length - 1];
                    if(j === 'k'){
                        obj.king['1'] = king;
                    } else if(j === 'K'){
                        obj.king['-1'] = king;
                    }
                }
            }
        }
        return obj;
    }
    static castleCheck(str:string){
        const castle = {
            'h1': 'K',
            'a1': 'Q',
            'h8': 'k',
            'a8': 'q'
        }[str];
        return castle ?? '';
    }
    static dataToFen(obj:Chess){
        const fen:string[] = [];
        fen.push(obj.arr.map(v => v.join('').replace(/e+/g, a => String(a.length))).join('/'));
        fen.push(obj.move);
        fen.push(obj.castle);
        fen.push(obj.pasang);
        fen.push(String(obj.half));
        fen.push(String(obj.full));
        return fen.join(' ');
    }
    static getPos(str:string){
        const x = str.charCodeAt(0) - 97;
        const y = 8 - Number(str[1]);
        return [x, y];
    }
    static getAxis(x:number, y:number, gap:number = 0, flag = 1){
        const total = y * 8 + x + gap * flag;
        if(total < 0 || total > 63){
            return 'o';
        }
        return `${String.fromCharCode(total % 8 + 97)}${8 - Math.floor(total / 8)}`;
    }
    changePiece(x:number, y:number, str:string){
        console.log(`${this.arr[y][x]} => ${str}`);
        this.arr[y][x] = str;
    }
    isMove(p:string){
        if(this.move === 'w' && !p.search(Chess.whiteReg) || this.move === 'b' && !p.search(Chess.blackReg)) return true;
        return false;
    }
    getPiece(x:number, y:number, gap:number = 0, flag:number = 1):PieceType{
        const total = y * 8 + x + gap * flag;
        const ori:[number, number, number, number] = [x, y, gap, flag];
        const end:[number, number] = [total % 8, Math.floor(total / 8)]
        if(total < 0 || total > 63){
            return { v: 'o', ori, end};
        } 
        return { v : this.arr[end[1]][end[0]], ori, end};
    }
    renderAll(){
        const pieces = document.querySelectorAll<HTMLDivElement>('div.chess');
        for(let i of pieces){
            const pos = Chess.getPos(i.dataset.pos);
            i.dataset.piece = this.getPiece(pos[0], pos[1]).v;
        }
    }
    moveGenerator(posStart:string):Set<string>{
        const [x, y] = Chess.getPos(posStart);
        const p1 = this.getPiece(x, y).v;
        const set = new Set<string>();
        let flag = 1;
        const checkBR = (x:number, y:number, gap:number, flag:number) => {
            const temp = this.getPiece(x, y, gap, flag);
            const total = y * 8 + x + gap * flag;
            const xx = total % 8;
            const yy = Math.floor(total / 8);
            const arr = [xx, yy];
            if(Math.abs(x - temp.end[0]) + Math.abs(y - temp.end[1]) > 2) return { arr, b: true };
            if(temp.v === 'e'){
                set.add(Chess.getAxis(...temp.ori));
                return { arr, b: false };
            } else if(!temp.v.search(Chess.op[flag])){
                set.add(Chess.getAxis(...temp.ori));
            }
            return { arr, b: true };
        };
        const bishop = (x:number, y:number, flag:number) => {
            for(let i = 7; i < 10; i += 2){
                for(let k = -1; k < 2; k += 2){
                    let xy = [x, y];
                    while(true){
                        const obj = checkBR(xy[0], xy[1], i * k, flag);
                        if(obj.b) break;
                        xy = obj.arr;
                    }
                }
            }
        };
        const rook = (x:number, y:number, flag:number) => {
            for(let i = 1; i < 9; i += 7){
                for(let k = -1; k < 2; k += 2){
                    let xy = [x, y];
                    while(true){
                        const obj = checkBR(xy[0], xy[1], i * k, flag);
                        if(obj.b) break;
                        xy = obj.arr;
                    }
                }
            }
        };
        if(p1 !== 'e'){
            if(!p1.search(Chess.whiteReg)) flag = -1;
            if(!p1.search(/p/i)){
                const m1 = this.getPiece(x, y, 8, flag);    //보통 전진
                const m2 = this.getPiece(x, y, 16, flag);   //두칸 전진
                const m3:PieceType[] = [];
                for(let i = 7; i < 10; i += 2){
                    m3.push(this.getPiece(x, y, i, flag));  //먹기 or 앙파상
                }
                if(m1.v === 'e'){
                    set.add(Chess.getAxis(...m1.ori));
                    if(m2.v === 'e' && y === (7 - 5 * flag) / 2){
                        set.add(Chess.getAxis(...m2.ori));
                    }
                }
                for(let i of m3){
                    if(!i.v.search(Chess.op[flag]) || Chess.getAxis(...i.ori) === this.pasang){
                        set.add(Chess.getAxis(...i.ori));
                    }
                }
            } else if(!p1.search(/n/i)){
                const arr = [-17, -15, -10, -6, 6, 10, 15, 17];
                for(let i of arr){
                    const temp = this.getPiece(x, y, i);
                    if((temp.v === 'e' ||
                    !temp.v.search(Chess.op[flag])) &&
                    Math.abs(temp.end[0] - x) + Math.abs(temp.end[1] - y) === 3){
                        set.add(Chess.getAxis(...temp.ori));
                    }
                }
            } else if(!p1.search(/b/i)){
                bishop(x, y, flag);
            } else if(!p1.search(/r/i)){
                rook(x, y, flag);
            } else if(!p1.search(/q/i)){
                bishop(x, y, flag);
                rook(x, y, flag);
            } else if(!p1.search(/k/i)){
                const arr = [-9, -8, -7, -1, 1, 7, 8, 9];
                for(let i of arr){
                    const temp = this.getPiece(x, y, i);
                    if((temp.v === 'e' ||
                    !temp.v.search(Chess.op[flag])) &&
                    Math.abs(temp.end[0] - x) + Math.abs(temp.end[1] - y) < 3){
                        set.add(Chess.getAxis(...temp.ori));
                    }
                }
                for(let i of this.castle){
                    const obj = {
                        'K': 'g1',
                        'Q': 'c1',
                        'k': 'g8',
                        'q': 'c8'
                    };
                    if(!i.search(Chess.op[-flag])){
                        const e = [];
                        const posEnd = obj[i];
                        const [x2, y2] = Chess.getPos(posEnd);

                        // 룩 존재 확인 (없으면 캐슬링 후보 추가 금지)
                        const rookFromX = x2 === 6 ? 7 : 0;
                        const mustBe = (flag === 1 ? 'r' : 'R');
                        if (this.getPiece(rookFromX, y2).v !== mustBe) {
                            continue;
                        }

                        let start = x2 === 6 ? 5 : 1;
                        let end = x2 === 6 ? 7 : 4;
                        for(let i = start; i < end; i++){
                            e.push(this.getPiece(i, y2).v === 'e');
                        }
                        start = x > x2 ? x2 : x;
                        for(let i = 0; i < 3 ; i++){
                            e.push(!this.isAttackedBy(start + i, y2, -flag)); // 적 공격만 확인
                        }
                        if(e.every(v => v)){
                            set.add(posEnd);   
                        }
                    }
                }
            }
        }
        for(let i of set){
            const cur = new Chess(this.str);
            cur.movePiece(posStart, i);
            const xy = cur.king[flag];
            if(cur.isAttackedBy(xy[0], xy[1], -flag)) set.delete(i); // 적 공격만 확인
        }
        return set;
    }
    // (x, y)가 'attackerFlag' 진영(1: 흑, -1: 백)의 공격을 받는가?
    isAttackedBy(x: number, y: number, attackerFlag: number): boolean {
        const inside = (xx: number, yy: number) => xx >= 0 && xx < 8 && yy >= 0 && yy < 8;
        const E_P = attackerFlag === 1 ? 'p' : 'P';
        const E_N = attackerFlag === 1 ? 'n' : 'N';
        const E_B = attackerFlag === 1 ? 'b' : 'B';
        const E_R = attackerFlag === 1 ? 'r' : 'R';
        const E_Q = attackerFlag === 1 ? 'q' : 'Q';
        const E_K = attackerFlag === 1 ? 'k' : 'K';

        // 1) 나이트
        const knightD = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
        for (const [dx, dy] of knightD) {
            const xx = x + dx, yy = y + dy;
            if (!inside(xx, yy)) continue;
            if (this.arr[yy][xx] === E_N) return true;
        }

        // 2) 폰 (적의 진행 방향 기준)
        const pawnAtk = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
        for (const [dx, dy] of pawnAtk) {
            const xx = x + dx, yy = y + dy;
            if (!inside(xx, yy)) continue;
            if (dy === 1 && attackerFlag === 1 && this.arr[yy][xx] === E_P) return true;   // 흑 폰
            if (dy === -1 && attackerFlag === -1 && this.arr[yy][xx] === E_P) return true; // 백 폰
        }

        // 3) 킹 인접 8칸
        const kingD = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
        for (const [dx, dy] of kingD) {
            const xx = x + dx, yy = y + dy;
            if (!inside(xx, yy)) continue;
            if (this.arr[yy][xx] === E_K) return true;
        }

        // 4) 대각 슬라이딩(비숍/퀸)
        const diagD = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dx, dy] of diagD) {
            let xx = x + dx, yy = y + dy;
            while (inside(xx, yy)) {
                const v = this.arr[yy][xx];
                if (v !== 'e') {
                    if (v === E_B || v === E_Q) return true;
                    break;
                }
                xx += dx; yy += dy;
            }
        }

        // 5) 수평/수직 슬라이딩(룩/퀸)
        const orthoD = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dx, dy] of orthoD) {
            let xx = x + dx, yy = y + dy;
            while (inside(xx, yy)) {
                const v = this.arr[yy][xx];
                if (v !== 'e') {
                    if (v === E_R || v === E_Q) return true;
                    break;
                }
                xx += dx; yy += dy;
            }
        }

        return false;
    }
    movePiece(posStart:string, posEnd:string):boolean{
        let flag = 1;
        const [x1, y1] = Chess.getPos(posStart);
        const [x2, y2] = Chess.getPos(posEnd); 
        const p = this.getPiece(x1, y1);

        const mover = this.move;
        const wasPawn = /p/i.test(p.v);

        let pasang = '-';
        let eat = false;
        if(!p.v.search(Chess.whiteReg)) flag = -1;
        if(!p.v.search(/p/i)){
            if(this.pasang === posEnd){     //앙파상
                this.changePiece(x2, y2 - flag, 'e');
                eat = true;
            } else if(Math.abs(y2 - y1) === 2){     //두 번 움직인 경우 앙파상 기능 활성화
                pasang = Chess.getAxis(x2, y2, 8, -flag);
            } else if ((flag === -1 && y2 === 0) || (flag === 1 && y2 === 7)) { // 승진(백/흑 모두)
                p.v = 'qQ'.match(Chess.op[-flag])[0];
            }
        } else if(!p.v.search(/k/i)){
            if(Math.abs(x2 - x1) === 2){   //캐슬링
                // 룩 존재 확인(없으면 캐슬링 불가)
                const rookFromX = x2 === 6 ? 7 : 0;
                const mustBe = (flag === 1 ? 'r' : 'R');
                if (this.getPiece(rookFromX, y2).v !== mustBe) {
                    return false;
                }
                this.changePiece(x2 === 6 ? 7 : 0, y2, 'e');
                this.changePiece(x2 === 6 ? 5 : 3, y2, flag === 1 ? 'r' : 'R');
            }
            this.king[flag] = [x2, y2];
            this.castle = this.castle.replace(flag === 1 ? /[kq]/g : /[KQ]/g, '');  //킹 캐슬링 없애기
        } else if(!p.v.search(/r/i)){       //룩 캐슬링 없애기
            this.castle = this.castle.replace(Chess.castleCheck(posStart), '');
        }
        if(this.getPiece(x2, y2).v !== 'e') eat = true;

        // 캡처로 인해 루크가 사라진 경우 캐슬링 권리 제거
        if (eat) {
            const lose = Chess.castleCheck(posEnd);
            if (lose) this.castle = this.castle.replace(lose, '');
        }

        this.changePiece(x2, y2, p.v);
        this.changePiece(x1, y1, 'e');
        
        // halfmove: 폰 이동이거나 캡처면 0, 아니면 +1
        this.half = (wasPawn || eat) ? 0 : (this.half + 1);

        // fullmove: 흑이 방금 뒀을 때(= 원래 차례가 흑) +1
        if (mover === 'b') this.full += 1;

        if (this.castle === '') this.castle = '-';

        if(this.move === 'b') this.move = 'w';
        else this.move = 'b';
        this.pasang = pasang;
        this.str = Chess.dataToFen(this);
        return eat;
    }
};