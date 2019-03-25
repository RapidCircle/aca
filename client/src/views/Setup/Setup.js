import React, { Component, Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Container, Nav, NavItem, NavLink, Card, CardBody, CardHeader, Col, Row } from 'reactstrap';


const Archive = React.lazy(() => import('./Archive'));
const SharePoint = React.lazy(() => import('./SharePoint'));
const Jobs = React.lazy(() => import('./Jobs'));


class Setup extends Component {

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  render() {
    
    const { match, location } = this.props;

    return (
      <Container fluid>
        <div className="animated fadeIn">
          <Row>
            <Col>
              <Card>
                <CardHeader>
                  <i className="fa fa-align-justify"></i> Settings <small className="text-muted">configuration</small>
                </CardHeader>
                <CardBody>
                  <Nav pills>
                      <NavItem>
                          <NavLink href={`#${match.url}/sharepoint`} active={location.pathname===`${match.url}/sharepoint`}>SharePoint</NavLink>
                      </NavItem>            
                      <NavItem>
                          <NavLink href={`#${match.url}/archive`} active={location.pathname===`${match.url}/archive`}>Archive</NavLink>
                      </NavItem>
                      <NavItem>
                          <NavLink href={`#${match.url}/jobs`} active={location.pathname===`${match.url}/jobs`}>Jobs</NavLink>
                      </NavItem>
                      <NavItem>
                          <NavLink href={`#${match.url}/workflows`} active={location.pathname===`${match.url}/workflows`}>Workflows</NavLink>
                      </NavItem>
                  </Nav>
                  <br/>
                  <Container fluid>
                    <Suspense fallback={this.loading()}>
                    <Switch>
                        <Route key="0" path={`${match.url}/sharepoint`} name="SharePoint" render={ props => ( <SharePoint {...props} /> )} />
                        <Route key="1" path={`${match.url}/archive`} name="Archive" render={ props => ( <Archive {...props} /> )} />
                        <Route key="2" path={`${match.url}/jobs`} name="Jobs" render={props=> ( <Jobs {...props} /> )} />                
                        <Redirect from={match.url} to={`${match.url}/sharepoint`} />
                    </Switch>
                    </Suspense>
                  </Container>
                </CardBody>
              </Card>
            </Col>
          </Row>               
        </div>
      </Container>
    )
  }
}

export default Setup;


