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
  Jumbotron,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from 'reactstrap';
import { connect } from 'react-redux';
import { fetchSharepoint, setSharepoint } from '../../actions/setup.js';
import { Treebeard, decorators } from 'react-treebeard';
import styled from '@emotion/styled';

const Div = styled('div', {
    shouldForwardProp: prop => ['className', 'children'].indexOf(prop) !== -1
})(({ style }) => style);



let styles = {
    tree: {
        base: {
            listStyle: 'none',
            margin: 0,
            padding: 0
        },
        node: {
            base: {
                position: 'relative'
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'block'
            },
            activeLink: {
                backgroundColor: 'green',
                color: 'green'
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginLeft: '-5px',
                    height: '24px',
                    width: '24px'
                },
                wrapper: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    margin: '-7px 0 0 -7px',
                    height: '14px'
                },
                height: 14,
                width: 14,
                arrow: {
                    fill: '#000000',
                    strokeWidth: 0
                }
            },
            header: {
                base: {
                    display: 'inline-block',
                    verticalAlign: 'center',
                    color: '#000'
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px'
                },
                title: {
                    lineHeight: '24px',
                    verticalAlign: 'middle'
                }
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '25px'
            },
            loading: {
                color: '#E2C089'
            }
        }
    }
}


class SharePoint extends Component {

    constructor() {
        super(...arguments);
        this.state = { hasChanged: false};
    }

  componentDidMount() {    

    this.setState({ hasChanged: false });
    let { dispatch } = this.props;
    dispatch(fetchSharepoint());
  }

  toggleDanger = () => {
    this.setState({
      danger: !this.state.danger,
    });
  }

  onToggle = (node, toggled) => {
    if(this.state.cursor){this.state.cursor.active = false;}
    if (!node.id) return;
    node.active = true;
    if(node.children){ node.toggled = toggled; }
    this.setState({ cursor: node, hasChanged: true });
  }

  setSharePointSite = async (e) => {
    
    let { dispatch } = this.props;

    let result = await dispatch(setSharepoint(this.state.cursor.id));
    if (result.type === "ERROR_FETCHING") {
        this.setState({
            errorTitle: 'Error while saving SharePoint configuration.',
            errorMessage: result.payload.response.data.message,
            danger: !this.state.danger,
        })        
    }
    else {
        this.setState( {
            ...this.state,
            hasChanged: false
        });
    }
  }

  undoChanges = (e) => {
    
    let { dispatch } = this.props;    
    dispatch(fetchSharepoint(this.state.cursor.id));

    this.setState( {
        ...this.state,
        hasChanged: false
    });
  }

  render() {

    let { sharepoint, error } = this.props;
    
    if (!sharepoint.tree) {
        sharepoint.tree = { id:'', name: 'Home', loading: true, children: [] }        
    }
    if (!sharepoint.current) {
        sharepoint.current = {};
    }
    sharepoint.tree.toggled = true;    

    decorators.Header = ({style, node}) => {

        let iconType = ''
        if (!this.state.hasChanged && node.id === sharepoint.current.graphSiteId) {
            iconType = 'square';
        } 
        else if (node.active) {
            iconType = 'square';
        }
        else {
            iconType = 'square-o';
        }
        
        const iconClass = `fa fa-${iconType}`;
        const iconStyle = {marginRight: '5px'};

        return (
            <Div style={style.base}>
                <Div style={style.title}>
                    <i className={iconClass} style={iconStyle}/>
                    {node.name}
                </Div>
            </Div>
        );
    };

    return (

        <div className="animated fadeIn">
            
            <h3>Resource storage</h3>
            <hr className="my-2" />
            <p>Azure resource metadata is synchronized with a SharePoint list enabling ACA to autonomously track resources, guard policies and execute workflows.</p>            

            <Row>
                <Col>
                    <Card>
                    <CardHeader>
                        <div className="card-header-actions">
                            { this.state.hasChanged &&
                            <Button outline size="sm" color="primary" onClick={this.undoChanges}>Cancel</Button>
                            } &nbsp;
                            <Button outline={!this.state.hasChanged} disabled={!this.state.hasChanged} size="sm" color="primary" onClick={this.setSharePointSite}>Save</Button>
                        </div>
                        <i className="fa fa-align-justify"></i> Sites <small className="text-muted">sites listed in the default site collection</small>
                    </CardHeader>
                    <CardBody>
                        <Treebeard
                            style={styles}
                            data={sharepoint.tree}
                            decorators={decorators}
                            onToggle={this.onToggle}/>
                    </CardBody>
                    </Card>
                </Col>
            </Row>
            
            <Modal isOpen={this.state.danger} toggle={this.toggleDanger} className={'modal-danger ' + this.props.className}>
                <ModalHeader toggle={this.toggleDanger}>{this.state.errorTitle}</ModalHeader>
                <ModalBody>
                {this.state.errorMessage}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={this.toggleDanger}>Dismiss</Button>{' '}
                    <Button color="secondary" onClick={this.toggleDanger}>Cancel</Button>
                </ModalFooter>
            </Modal>            
            
        </div>
    )
  }
}

function mapStateToProps(state) {
  const { sharepoint, error } = state;

  return {
    sharepoint,
    error
  }
}

export default connect(mapStateToProps)(SharePoint);
