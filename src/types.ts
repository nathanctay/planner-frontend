export type CardStyle =
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

export type Note = {
    id: string
    x: number
    y: number
    w: number
    h: number
    style: CardStyle
    header: string
    content: string
    zIndex: number
}

export type WSMessage =
    | { type: 'init'; notes: Note[] }
    | { type: 'update'; note: Note }
    | { type: 'delete'; id: string }