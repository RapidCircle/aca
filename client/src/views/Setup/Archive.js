import React, { Component, Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Container } from 'reactstrap';
import { logout } from '../../actions/user.js';
import { Link } from 'react-router-dom';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Col,
  Row,
  Table,
  Form,
  FormGroup,
  FormText,
  FormFeedback,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label,
  Button
} from 'reactstrap';
import { connect } from 'react-redux';
import { fetchJobs } from '../../actions/jobs.js';


class Archive extends Component {

  constructor() {
        super(...arguments);
        this.state = { hasChanged: false};

        this.resourceGroupInput = React.createRef();
        this.storageAccountInput = React.createRef();
    }

  componentDidMount() {
    let { dispatch } = this.props;
    dispatch(fetchJobs());
  }

  hasChanged = (e) => {    
    this.setState({ hasChanged: true })
  }

  undoChanges = (e) => {
    //TODO: do stuff
    this.setState({
      hasChanged: false
    })
  }

  setArchiveLocation = (e) => {
    //TODO: do stuff
    this.setState({
      hasChanged: false
    })
  }

  render() {

    let { jobs } = this.props;

    return (

      <div className="animated fadeIn">
        <h3>Archive location</h3>
        <hr className="my-2" />
        <p>ACA can help you archive large storage accounts by running an Archive workflow. All content will be moved to a so called Cool storage account in Azure.</p>            
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <div className="card-header-actions">
                    { this.state.hasChanged &&
                    <Button outline size="sm" color="primary" onClick={this.undoChanges}>Cancel</Button>
                    } &nbsp;
                    <Button outline={!this.state.hasChanged} disabled={!this.state.hasChanged} size="sm" color="primary" onClick={this.setArchiveLocation}>Save</Button>
                </div>
                Archive <small className="text-muted">example</small>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col xs="12">
                    <FormGroup>
                      <Label htmlFor="name">Resource group</Label>
                      <Input type="text" ref={this.resourceGroupInput} placeholder="Archive" onChange={this.hasChanged} required />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col xs="12">
                    <FormGroup>
                      <Label htmlFor="ccnumber">Storage account</Label>
                      <Input type="text" ref={this.storageAccountInput} placeholder="CompanyCoolArchive" required />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
        
      </div>
    )
  }
}

function mapStateToProps(state) {
  const { jobs } = state;

  return {
    jobs
  }
}

export default connect(mapStateToProps)(Archive);
