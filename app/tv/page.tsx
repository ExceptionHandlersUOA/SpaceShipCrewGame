"use client";
import { useEffect, useRef, useState } from "react";
import { GameStateType, NICE_ROLE_NAME, RoleData, RoleName, State } from "../common";
import styles from "./page.module.css";
import AsteroidField from "../ui/captain/AsteroidField";

import { Michroma, Chivo_Mono } from "next/font/google";
import Comm, { WriteMessage } from "../comm";
const michroma = Michroma({ weight: '400', subsets: ["latin"] });
const chivoMono = Chivo_Mono({ weight: '400', subsets: ["latin"] });

type PlayerData = {user_id: number; role_name: RoleName };

const PLAYERS: PlayerData[] = [
    {user_id: 1, role_name: 'pilot'},
    {user_id: 2, role_name: 'engineer'},
    {user_id: 3, role_name: 'chemist'},
];

function getElapsedString(elapsedSecs: number): string {
    const secs = elapsedSecs % 60;
    const secsString = secs.toString().padStart(2, '0');
    const mins = Math.floor((elapsedSecs - secs) / 60);
    const minsString = mins.toString().padStart(2, '0');
    return `${minsString}:${secsString}`;
}

function getPlayerDisplayText(roleData: RoleData): string {
    let displayText = roleData.username;
    let role = NICE_ROLE_NAME[roleData.roleId];
    if (role !== '') {
        displayText += ` (${role})`;
    }
    return displayText;
}

function playerList(players: { [user_id: string | number]: RoleData }) {
    const playerArr = Object.entries(players);
    playerArr.sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));
    if (playerArr.length === 0) {
        return <div style={{color: "grey"}}>No players</div>;
    } else {
        return playerArr.map(([userId, roleData]: [string, RoleData]) => {
            return (
                <ul className={styles.playerRow} key={userId.toString()}>
                    <span className={styles.circleSpan}>P{userId}</span> {getPlayerDisplayText(roleData)}
                </ul>
            );
        });
    }
}

const comm = new Comm();

function TvDisplay() {
    const [players, setPlayers] = useState<PlayerData[]>(PLAYERS);

    const [timeSecs, setTimeSecs] = useState(0);

    const [state, setState] = useState<State | null>(null);

    const [roomCode, setRoomCode] = useState<string>('');

    const [isGameReady, setIsGameReady] = useState(false);

    const [isGameEnded, setIsGameEnded] = useState(false);

    const [gameState, setGameState] = useState<GameStateType>('lobby');
    const gameStateRef = useRef(gameState);

    const [messageLog, setMessageLog] = useState<WriteMessage[]>([]);

    useEffect(() => {
        async function doAsyncStuff() {
            await comm.start();

            let roomCreateRes = await comm.roomCreate();
            console.log(roomCreateRes);
            if (roomCreateRes != null) {
                setRoomCode(roomCreateRes.roomCode);
            }
        }

        comm.onWriteMessage((data: WriteMessage) => {
            setMessageLog((msgLog) => [...msgLog.slice(-7), data]);
        });

        comm.onState((state: State) => {
            console.log(state);
            setState(state);
            setGameState(state.gameState);
            gameStateRef.current = state.gameState;
        });

        comm.onGameNotReady(() => { setIsGameReady(false); });
        comm.onGameReady(() => { setIsGameReady(true); });

        let interval = undefined;

        interval = setInterval(() => {
            if (gameStateRef.current == 'inGame') {
                setTimeSecs((timeSecs) => timeSecs + 1);
            }
        }, 1000);

        doAsyncStuff().catch((e) => {
            console.error(e);
        });

        return () => {
            clearInterval(interval);
            comm.stop();
        };
    }, []);

    function handleStartGame() {
        async function doAsyncStuff() {
            await comm.roomStart();
        }

        doAsyncStuff().catch((e) => {
            console.error(e);
        });
    }

    return <div className={(styles.tv + ' ' + michroma.className)}>
        <div className={styles.infoColumn}>
            <div>
                <div>
                    <h1>Amidst Us</h1>
                </div>
                <div className={styles.playerList}>
                    {
                        playerList(state?.roles ?? {})
                    }
                </div>
                {
                    (isGameReady && gameState === 'lobby') ?
                        <button className={styles.ready + ' ' + chivoMono.className} onClick={handleStartGame}>
                            Start game!
                        </button>
                    :
                        <></>
                }
            </div>
            <>
                {
                    (gameState === 'inGame' || gameState === 'gameOver') ?
                        <div className={styles.timer}>
                            <span className={(styles.time + ' ' + chivoMono.className)}>{getElapsedString(timeSecs)}</span>
                            <span className={styles.label}>Time Survived</span>
                        </div>
                    :
                        <div className={styles.timer}>
                            <span className={(styles.time + ' ' + chivoMono.className)}>{roomCode}</span>
                            <span className={styles.label}>Room Code - Join now!</span>
                        </div>
                }
            </>
        </div>
        <div className={styles.visual}>
            <div className={styles.visualContainer}>
                <AsteroidField className={styles.canvas} onAsteroidClick={() => {}}></AsteroidField>
                <div className={styles.instructions}>
                    <h2>How to play:</h2>
                    <b>Chemist - makes fuel, uses water:</b><br/>
                    The chemist must communicate with the pilot to fill in the correct<br/>
                    sequence of hydrogen and oxygen that the pilot has, to generate fuel.<br/>
                    <br/>
                    <b>Captain - makes water, uses electricity:</b><br/>
                    The pilot must shoot asteroids to gather water.<br/>
                    <br/>
                    <b>Engineer - makes electricity, uses fuel:</b><br/>
                    The Engineer must Match sin waves to generate electricity.
                </div>
                <div className={styles.log}>
                    <ul className={styles.ul}>
                        {
                            messageLog.map((message, index) => {
                                return <li key={index} style={{color: message.colorHex}} className={styles.li} dangerouslySetInnerHTML={{__html: message.message}}></li>;
                            })
                        }
                    </ul>
                </div>
            </div>
        </div>
    </div>
}

export default function Tv() {
    return TvDisplay();
}
