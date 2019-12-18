Implementing react's main features in both ways: [stack](https://github.com/everywill/mini-react/tree/feature/stack), [fiber](https://github.com/everywill/mini-react/tree/feature/fiber). Click to check details.

Mini-react of both vrsion export `createElement`, `Component`, `render`;  `useState`is also exported in fiber version. 

#### stack

Implement diff-algo  in a very straightforward  recursIve way. 



#### fiber

Based on stack version and reImplement reconcilation with loop, introducing fiber to restore the processing state . The dom related operations are extracted.

minimal example:

```
// index.js
import mReact from 'mini-react';
import App from './components/App';


mReact.render(<App />, document.getElementById('app'));

// ./component/App.js
import mReact from 'mini-react';
import Counter from './CounterHook';
import logo from '../logo.png';
import './App.css';

export default class App extends mReact.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: 'React',
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        text: 'Starter'
      })
    }, 3000);
  }

  componentDidUpdate() {
    console.log('has updated');
  }

  render() {
    const { text } = this.state;
    return (
      <div onClick={() => console.log('click')} className='container'>                
        <img className='logo' src={logo} />
        <h1 className='title'>{text}</h1>
        <Counter />
      </div>
    );
  }
}

// ./components/counterHook.js
import mReact, { useState }  from 'mini-react';

export default function Counter() {
  const [state, setState] = useState(1);

  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state}
    </h1>
  );
}
```
