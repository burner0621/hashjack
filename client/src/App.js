import React from "react";
import { HashRouter, Route, Switch, Redirect } from "react-router-dom";

// styles for this kit
import "./input.css"
import "assets/css/bootstrap.min.css";
import "assets/scss/now-ui-kit.scss?v=1.5.0";

// pages
import Home from "pages/Home";

function App() {
  return (
    <>
      <HashRouter>
        <Switch>
          <Route path="/home" render={(props) => <Home {...props} />} />
          <Redirect from="/" to="/home" />
        </Switch>
      </HashRouter>
    </>
  );
}
export default App;