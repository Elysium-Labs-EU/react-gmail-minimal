import './App.scss'
import Home from './components/Home'
import EmailDetail from './components/EmailDetail/EmailDetail'
import ComposeEmail from './components/Compose/ComposeEmail'
import Settings from './components/Settings'
import InformationOverview from './components/InformationOverview'
import FileOverview from './components/FileOverview'
import Inbox from './components/Inbox'
import Header from './components/Header'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="App">
        <div className="tlOuterContainer">
          <Header />
        </div>

        {/* Fix the bug with the path of the email id detail not being accurate */}
        <Switch>
          <Route path="/" exact={true} component={Home} />
          <Route path="/mail/:labelId/:threadId" component={EmailDetail} />
          <Route path="/compose" component={ComposeEmail} />
          <Route path="/settings" component={Settings} />
          <Route path="/information-overview" component={InformationOverview} />
          <Route path="/file-overview" component={FileOverview} />
          <Route path="/inbox" component={Inbox} />
        </Switch>
      </div>
    </Router>
  )
}

export default App
