'use client'

import { useState } from "react";
import styles from "./EngineerPage.module.css"
import SineGraph from '../engineer/SineGraph';
import ResourceBar, { Resources } from "../ResourceBar";


export default function EngineerPage({onSineMatch, waterAmount}: {onSineMatch: any, waterAmount: any}) {
    return (
        <div className={styles.playPage}>
            <br/>
            <h1>ENGINEER</h1>
            {/* style={{
                border: '2px solid black',  // Border thickness, style, and color
                padding: '10px',            // Optional: Add padding inside the border
                margin: '10px'              // Optional: Add margin outside the border
            }} */}
            <h2>Match the waves!</h2>
            <SineGraph sineMatch={onSineMatch}/>
            <ResourceBar resource={Resources.Water} value={waterAmount} />
        </div>
    );
}
