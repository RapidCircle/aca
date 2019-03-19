import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, CardBody, CardHeader, Col, Row, Table } from 'reactstrap';
import { connect } from 'react-redux';
import { fetchJobs } from '../../actions/jobs.js';


class Jobs extends Component {


  componentDidMount() {
    let { dispatch } = this.props;
    dispatch(fetchJobs());
  }

  render() {

    let { jobs } = this.props;

    return (
      <div className="animated fadeIn">
        <Row>
          <Col xl={6}>
            <Card>
              <CardHeader>
                <i className="fa fa-align-justify"></i> Jobs <small className="text-muted">example</small>
              </CardHeader>
              <CardBody>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th scope="col">Id</th>
                      <th scope="col">schedule</th>
                      <th scope="col">description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.data.map((job, index) =>
                      <tr key={job.id.toString()}>
                        <th scope="row"><Link to={job.code}>{job.id}</Link></th>                        
                        <td>{job.schedule}</td>
                        <td>{job.description}</td>
                      </tr>
                    )}
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
