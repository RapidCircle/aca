import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Col,
  Row,
  Table,
  Button,
  Form,
  FormGroup,
  FormText,
  FormFeedback,
  Input,
  Label,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  ButtonDropdown
} from 'reactstrap';
import { connect } from 'react-redux';
import { fetchJobs } from '../../actions/jobs.js';
import { WSAEBADF } from 'constants';


function JobToggle(job) {
  if (!job.enabled) {
    return (<Button outline size="sm" color="primary">enable</Button>);
  }
  else {
    return (<Button outline size="sm" color="danger">disable</Button>);
  }
}

function WorkflowToggle(wf) {
  if (!wf.enabled) {
    return (<Button outline size="sm" color="primary">enable</Button>);
  }
  else {
    return (<Button outline size="sm" color="danger">disable</Button>);
  }
}

class Jobs extends Component {

  constructor() {
    super(...arguments);
    this.state = { hasChanged: false};
  }

  componentDidMount() {
    let { dispatch } = this.props;
    dispatch(fetchJobs());
  }

  setChanged = () => {
    this.setState({
      hasChanged: true
    });
  }

  render() {

    let { jobs } = this.props;

    return (
      <div className="animated fadeIn">
        <Row>
          <Col md="7">
            <Card>
              <CardHeader>
                <i className="fa fa-align-justify"></i> Jobs <small className="text-muted">background processors</small>
              </CardHeader>
              <CardBody>
                <Table responsive bordered>
                  <thead> 
                    <tr>
                      <th scope="col">Id</th>
                      <th scope="col">schedule</th>
                      <th scope="col">description</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.data.map((job, index) =>
                      <tr key={job.id.toString()}>
                        <th scope="row"><Link to={job.code}>{job.id}</Link></th>                        
                        <td>{job.runsAt}</td>
                        <td>{job.description}</td>
                        <td>{JobToggle(job)}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
          <Col md="5">
            <Card>
              <CardHeader>
                <div className="card-header-actions">
                    { !this.state.hasChanged &&
                    WorkflowToggle({ enabled: false })
                    }
                    { this.state.hasChanged &&
                    <Button outline size="sm" color="primary" onClick={this.undoChanges}>Cancel</Button>
                    } &nbsp;
                    { this.state.hasChanged &&
                    <Button outline={!this.state.hasChanged} disabled={!this.state.hasChanged} size="sm" color="primary" onClick={this.setSharePointSite}>Save</Button>
                    }
                </div>
                <i className="fa fa-align-justify"></i> Workflow <small className="text-muted">settings</small>
              </CardHeader>
              <CardBody>
                <FormGroup>
                  <Label htmlFor="name">Check every</Label>
                  <Input type="select" name="select" id="select" onChange={this.setChanged}>
                    <option value="0">5 seconds</option>
                    <option value="1">30 seconds</option>
                    <option value="2">1 minute</option>                    
                  </Input>
                </FormGroup>
                <FormGroup>                  
                  <Label htmlFor="name">Run as</Label>
                  <Input type="select" name="select" id="select">
                    <option value="0">5 seconds</option>
                    <option value="1">30 seconds</option>
                    <option value="2">1 minute</option>                    
                  </Input>
                </FormGroup>
                <Label htmlFor="name">Installed workflows</Label>
                <Table responsive bordered>
                  <thead> 
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>                    
                    <tr key=''>
                      <th scope="row">a</th>                        
                      <td>Delete, Archive</td>
                    </tr>
                  </tbody>
                </Table>
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

export default connect(mapStateToProps)(Jobs);
