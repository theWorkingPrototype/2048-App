'use-strict';

import React, { RefObject, useEffect, useRef } from "react";
import { Animated, Dimensions, GestureResponderEvent, StyleSheet, Text, View } from "react-native";
type Color = {
    r: number;
    g: number;
    b: number;
}
class Board extends React.Component {
    gameKeys = ["left","right","up","down"];
    colors:Array<Color> = []
    saved:Array<Color> = []
    padding: number;
    size: number;
    xDown: number | null;
    yDown:number | null;
    ref:RefObject<HTMLDivElement>;
    newSpawn: Array<number> = []
    windowWidth: number;
    state = {
        gameOver: false,
        table: [
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
        ]
    };
    constructor(props: any) {
        super(props);
        let table = [
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
        ];
        this.colors[2] = { r:227, g:217, b:208};
        this.colors[64] = { r:247, g:97, b:72 };           // 5 + 1
        this.colors[2048] = { r:238, g:194, b:46 };        // 10 + 1
        this.colors[65536] = { r:0, g:0, b:0 };            // 15 + 1
        this.windowWidth = Math.min(Dimensions.get('window').width, Dimensions.get('window').height);
        this.padding = props.padding || 10;
        this.size = (this.windowWidth - this.padding * 7) / 4;
        this.xDown = null;
        this.yDown = null;
        this.ref = React.createRef();
        this.state = {
            table: table,
            gameOver: false
        };
    }
    reset() {
        let table = [
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
        ]
        this.setState({table: table, gameOver:false});
    }
    componentDidMount() {
        this.addSquare();
    }
    mergeColor(c1: Color,n1: number,c2: Color,n2: number){
        let color:Color;
        color = {
            r: Math.floor((c1.r*n2 + c2.r*n1)/(n1+n2)),
            g: Math.floor((c1.g*n2 + c2.g*n1)/(n1+n2)),
            b: Math.floor((c1.b*n2 + c2.b*n1)/(n1+n2)),
        }
        return color;
        // return "rgb("+color[0]+","+color[1]+","+color[2]+")";
    }
    cascadedPush(q:Array<number>=[],t: number):number{
        if(!t) return 0;
        if(!q.length || q[q.length-1] != t) return q.push(t);
        return this.cascadedPush(q,2*(q.pop() || 0));
    }
    noMovePossible(table: number[][] = this.state.table): boolean {
        for(let i=0;i<table.length;i++){
            for(let j=0;j<table[i].length;j++){
                if(table[i][j] == 0) return false;
                if(i<table.length-1 && table[i][j] == table[i+1][j]) return false;
                if(j<table[i].length-1 && table[i][j] == table[i][j+1]) return false;
            }
        }
        return true;
    }
    getCloneTable(table:number[][]= this.state.table) {
        let newTable: number[][] = [];
        for(let i=0;i<table.length;i++){
            newTable[i] = [];
            for(let j=0;j<table[i].length;j++){
                newTable[i][j] = table[i][j];
            }
        }
        return newTable;
    }
    getMove(direction: string, table:number[][] = this.state.table){ // 0.03 ms average
        let a = table;
        let i,j;
        switch(direction){
            case "left":
                for(i=0;i<4;i++){
                    let queue: Array<number> = [];
                    for(j=0;j<4;j++){
                        this.cascadedPush(queue, a[i][j])
                        a[i][j] = 0;
                    }
                    let k = 0;
                    while(queue.length){
                        a[i][k++] = queue.shift() || 0;
                    }
                } break;
            case "right":
                for(i=0;i<4;i++){
                    let queue: Array<number> = [];
                    for(j=3;j>=0;j--){
                        this.cascadedPush(queue, a[i][j])
                        a[i][j] = 0;
                    }
                    let k = 3;
                    while(queue.length){
                        a[i][k--] = queue.shift() || 0;
                    }
                } break;
            case "up":
                for(j=0;j<4;j++){
                    let queue: Array<number> = [];
                    for(i=0;i<4;i++){
                        this.cascadedPush(queue, a[i][j])
                        a[i][j] = 0;
                    }
                    let k = 0;
                    while(queue.length){
                        a[k++][j] = queue.shift() || 0;
                    }
                } break;
            case "down":
                for(j=0;j<4;j++){
                    let queue: Array<number> = [];
                    for(i=3;i>=0;i--){
                        this.cascadedPush(queue, a[i][j])
                        a[i][j] = 0;
                    }
                    let k = 3;
                    while(queue.length){
                        a[k--][j] = queue.shift() || 0;
                    }
                } break;
        }
        return a;
    }
    onTouchEnd(e:GestureResponderEvent) {
        this.xDown = 0;
        this.yDown = 0;
        return true;
    }
    onTouchMove(e: GestureResponderEvent) {
        // e.preventDefault();
        if ( !this.xDown || !this.yDown ) {
            this.xDown = e.nativeEvent.pageX;
            this.yDown = e.nativeEvent.pageY;
            return;
        }
        var xUp = e.nativeEvent.pageX;
        var yUp = e.nativeEvent.pageY;
        var xDiff = this.xDown - xUp;
        var yDiff = this.yDown - yUp;
        if(Math.abs(xDiff) < 2 && Math.abs(yDiff) < 2) return;
        if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
            if ( xDiff > 0 ) {
                this.move("left");
            } else {
                this.move("right");
            }
        } else {
            if ( yDiff > 0 ) {
                this.move("up");
            } else {
                this.move("down");
            }
        }
        this.xDown = null;
        this.yDown = null;
        return true;
    }
    toString(color:Color) {
        return "rgb("+color.r+","+color.g+","+color.b+")";
    }
    move(direction: string){
        let table = this.getCloneTable(this.state.table);
        table = this.getMove(direction,table);
        if(table.toLocaleString() == this.state.table.toLocaleString()) return;
        if(this.noMovePossible(table)){
            this.setState({gameOver: true});
            return;
        }
        this.setState({table: this.getMove(direction)});
        this.addSquare();
    }
    getFreePositions(table: number[][]){
        let freePositions = [];
        let i,j;
        for(i=0;i<4;i++){
            for(j=0;j<4;j++){
                if(!table[i][j]){
                    freePositions.push([i,j]);
                }
            }
        }
        return freePositions;
    }
    addSquare(){
        this.newSpawn = [];
        let freePositions = this.getFreePositions(this.state.table);
        if(!freePositions.length) return;
        let pos = freePositions[Math.floor(Math.random()*freePositions.length)];
        let val = Math.random() > 0.5 ? 2 : 4;
        let a = this.getCloneTable();
        a[pos[0]][pos[1]] = val;
        this.newSpawn[0] = pos[0];
        this.newSpawn[1] = pos[1];
        this.setState({ table : a });
    }
    renderSquare(i: number,j: number) {
        let props = {
            val:this.state.table[i][j],
            margin:this.padding,
            size:this.size,
        }
        let color = this.saved[props.val];
        let colors = this.colors;
        if(!color){
            let n = Math.log2(props.val) - 1;
            if(n > 15) n = 15;
            if(n >= 10){
                color = this.mergeColor(colors[65536],15-n,colors[2048],n-10);
            }
            else if(n >= 5){
                color = this.mergeColor(colors[2048],10-n,colors[64],n-5);
            }
            else {
                color = this.mergeColor(colors[64],5-n,colors[2],n);
            }
            this.saved[props.val] = color;
        }
        // let animation = "";
        // if(this.newSpawn[0] == i && this.newSpawn[1] == j){
        //     animation = styles.appear + " 0.1s linear forwards";
        // }
        if(this.newSpawn[0] == i && this.newSpawn[1] == j){
            this.newSpawn = [];
            return (
                <AppearView key={i+"-"+j}
                    style={{
                    ...styles.square ,
                    transform: [{
                        scale:1
                    }],
                    top: props.margin + i*(props.margin+props.size),
                    left: props.margin + j*(props.margin+props.size),
                    width:props.size,
                    height:props.size,
                    backgroundColor:this.toString(color),
                    // lineHeight:props.size,
                    // animation:animation
                }}>
                <Text style={{
                    ...styles.text
                }}>
                    {props.val}
                </Text>
                </AppearView>
            );
        }
        return (
            <View key={i+"-"+j}
                style={{
                    ...styles.square ,
                    transform: [{
                        scale:1
                    }],
                    top: props.margin + i*(props.margin+props.size),
                    left: props.margin + j*(props.margin+props.size),
                    width:props.size,
                    height:props.size,
                    backgroundColor:this.toString(color),
                    // lineHeight:props.size,
                    // animation:animation
                }}>
                <Text style={{
                    ...styles.text
                }}>
                    {props.val}
                </Text>
            </View>
        );
    }
    render(){
        return (
            <View key="2048board"
                onMoveShouldSetResponder={e => this.onTouchMove(e)}
                onTouchEnd={e => this.onTouchEnd(e)}
                style={{
                    ...styles.board ,
                    margin:this.padding,
                    width:this.size*4+this.padding*5,
                    height:this.size*4+this.padding*5,
                }}>
                {
                    this.state.table.map((row,i) => 
                        row.map((val,j) => {
                            if(val) return this.renderSquare(i,j);
                            else return null;
                        })
                    )
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    square: {
        borderRadius: 2,
        fontWeight: 'bold',
        position: 'absolute',
        textAlign: 'center',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor:'black',
        justifyContent: "center",
        alignItems: "center",
        elevation: 10,
    },
    board: {
        borderRadius: 2,
        position: 'relative',
        borderStyle: 'solid',
        borderWidth:1,
        borderColor:'black',
        backgroundColor: '#B3A698',
    },
    text: {
        fontSize:14,
        fontFamily:'monospace'
    }
});

const AppearView = (props: any) => {
    const appear = useRef(new Animated.Value(0)).current  // Initial value for opacity: 0
        useEffect(() => {
        Animated.timing(
            appear,{
            toValue: 1,
            duration: 100,
            useNativeDriver: true
            }
        ).start();
        }, [appear])
  
    return (
        <Animated.View                 // Special animatable View
            style={{
            ...props.style,
                transform:[{
                    scale:appear
                }]
            }}
        >
            {props.children}
        </Animated.View>
    );
}

const MoveView = (props: any) => {
    const move = useRef(new Animated.Value(props.start)).current
        useEffect(() => {
        Animated.timing(
            move,{
                toValue: props.end,
                duration: 100,
                useNativeDriver: true
            }
        ).start();
        }, [move])
    if(props.isY){
        return (
            <Animated.View
                style={{
                ...props.style,
                    transform:[{
                        translateY:move
                    }]
                }}
            >
                {props.children}
            </Animated.View>
        );
    }
    else return (
        <Animated.View
            style={{
            ...props.style,
                transform:[{
                    translateX:move
                }]
            }}
        >
            {props.children}
        </Animated.View>
    );
}

export default Board;