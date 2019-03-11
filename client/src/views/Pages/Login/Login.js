import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardBody, CardGroup, Col, Container, Form, Input, InputGroup, InputGroupAddon, InputGroupText, Row } from 'reactstrap';

function openLogin() {
  window.open('http://localhost:3000/_auth/signin')
}

class Login extends Component {
  render() {
    return (
      <div className="app flex-row align-items-center">
        <Container>
          <Row className="justify-content-center">
            <Col md="8">
              <CardGroup>                
                <Card className="py-5 d-md-down-none" style={{ width: '44%' }}>
                  <CardBody className="text-center">
                    <div>
                      <h2>Unauthorized</h2>
                      <p><b>Azure Cleansing App</b> is configured to use your organisations Azure Active Directory as an identity store. Please click the Login to be redirected to login through Microsoft.</p>
                      <a href="javascript:void(0);" onClick={openLogin}>
                        <Button className="mt-3 btn-lg btn-openid btn-brand" active tabIndex={-1}><i className="fa fa-openid"></i><span>Login</span></Button>
                      </a>
                    </div>
                  </CardBody>
                </Card>
              </CardGroup>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Login;
