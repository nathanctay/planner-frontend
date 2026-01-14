import './App.css'
import Card from './components/Card'

function App() {
  return (
    <>
      <h1 className="text-3xl font-bold underline">
        Hello world!
      </h1>
      <Card style="purple" header="I am a card">
        <p>I am Card</p>
        <p>Fear me</p>
      </Card>
    </>
  )
}

export default App
