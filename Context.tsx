import React from "react";
import { createContext, useContext } from 'react';

export interface AlertState {
    type: string,
    title: string,
    message: string,
    autoHide: number
}
// 这里用范型会报错. todo
export const AlertContext = createContext(null);