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
            'g1': 'K',
            'a1': 'Q',
            'c1': 'Q',
            'h8': 'k',
            'g8': 'k',
            'a8': 'q',
            'c8': 'q'
        }[str];
        if(castle) return castle;
        else return '';
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
                const m1 = this.getPiece(x, y, 8, flag);    //?????? ??????
                const m2 = this.getPiece(x, y, 16, flag);   //?????? ??????
                const m3:PieceType[] = [];
                for(let i = 7; i < 10; i += 2){
                    m3.push(this.getPiece(x, y, i, flag));  //?????? or ?????????
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
                        let start = x2 === 6 ? 5 : 1;
                        let end = x2 === 6 ? 7 : 4;
                        for(let i = start; i < end; i++){
                            e.push(this.getPiece(i, y2).v === 'e');
                        }
                        start = x > x2 ? x2 : x;
                        for(let i = 0; i < 3 ; i++){
                            e.push(!this.isCheck(start + i, y2));
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
            if(cur.isCheck(xy[0], xy[1])) set.delete(i);
        }
        return set;
    }
    isCheck(x:number, y:number){
        
        return false;
    }
    movePiece(posStart:string, posEnd:string):boolean{
        let flag = 1;
        const [x1, y1] = Chess.getPos(posStart);
        const [x2, y2] = Chess.getPos(posEnd); 
        const p = this.getPiece(x1, y1);
        let pasang = '-';
        let eat = false;
        if(!p.v.search(Chess.whiteReg)) flag = -1;
        if(!p.v.search(/p/i)){
            if(this.pasang === posEnd){     //?????????
                this.changePiece(x2, y2 - flag, 'e');
                eat = true;
            } else if(Math.abs(y2 - y1) === 2){     //??? ??? ????????? ?????? ????????? ?????? ?????????
                pasang = Chess.getAxis(x2, y2, 8, -flag);
            } else if((7 + 7 * flag) === y2){
                p.v = 'qQ'.match(Chess.op[-flag])[0];
            }
        } else if(!p.v.search(/k/i)){
            if(Math.abs(x2 - x1) === 2){   //?????????
                this.changePiece(x2 === 6 ? 7 : 0, y2, 'e');
                this.changePiece(x2 === 6 ? 5 : 3, y2, flag === 1 ? 'r' : 'R');
            }
            this.king[flag] = [x2, y2];
            this.castle = this.castle.replace(flag === 1 ? /[kq]/g : /[KQ]/g, '');  //??? ????????? ?????????
        } else if(!p.v.search(/r/i)){       //??? ????????? ?????????
            this.castle = this.castle.replace(Chess.castleCheck(posStart), '');
        }
        if(this.getPiece(x2, y2).v !== 'e') eat = true;
        this.changePiece(x2, y2, p.v);
        this.changePiece(x1, y1, 'e');
        if(this.move === 'b') this.move = 'w';
        else this.move = 'b';
        this.pasang = pasang;
        this.str = Chess.dataToFen(this);
        return eat;
    }
};