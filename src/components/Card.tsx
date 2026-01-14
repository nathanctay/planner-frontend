import { motion } from "motion/react"

type CardStyle =
    "blue" |
    "indigo" |
    "purple" |
    "pink" |
    "red" |
    "orange" |
    "yellow" |
    "green" |
    "teal" |
    "cyan" |
    "white" |
    "gray" |
    "gray-dark"

type CardProps = {
    style: CardStyle;
    header?: string;
    children?: React.ReactNode;
}

const styleClasses: Record<CardStyle, string> = {
    blue: "bg-blue-500 text-white",
    indigo: "bg-indigo-500 text-white",
    purple: "bg-purple-500 text-white",
    pink: "bg-pink-500 text-white",
    red: "bg-red-500 text-white",
    orange: "bg-orange-500 text-white",
    yellow: "bg-yellow-400 text-black",
    green: "bg-green-500 text-white",
    teal: "bg-teal-500 text-white",
    cyan: "bg-cyan-500 text-white",
    white: "bg-white text-black",
    gray: "bg-gray-500 text-white",
    "gray-dark": "bg-gray-800 text-white",
}

function Card({ style, header, children }: CardProps) {
    return (
        <motion.div
            drag
            dragMomentum={false}
            whileDrag={{ scale: 1.05, zIndex: 50 }}
            className={`
            relative flex flex-col min-w-0 break-words 
            cursor-grab active:cursor-grabbing
            ${styleClasses[style]} 
            border border-solid border-[rgba(0,0,0,0.175)] 
            rounded-[0.375rem] mb-3 w-full
        `}>
            {header && (
                <div className="
                    py-2 px-4 mb-0 
                    bg-black/10
                    border-b border-solid border-[rgba(0,0,0,0.175)] 
                    rounded-t-[calc(0.375rem-1px)]
                ">
                    {header}
                </div>
            )}
            <div className="flex-auto p-4">
                <div className="last:mb-0">{children}</div>
            </div>
        </motion.div>
    )
}
export default Card 