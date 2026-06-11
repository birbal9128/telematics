import React from "react";
import "./loader.css";



export const Loader: React.FC = () => {
    return (
        <div className="fullscreen-loader">
                <img className='tractor' src="/images/tractorloader.gif" alt="Loading..." />
        </div>
    );
};