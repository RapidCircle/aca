import React, { Component } from 'react';
import {
  ButtonDropdown,
  ButtonGroup,
  Card,
  CardBody,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,

} from 'reactstrap';

import createDebugger from 'debug';
const debug = createDebugger('TestComponent');




export class TestComponent extends Component {
  constructor(props) {
    super(props);   
    debug('constructor');    
    this.state = {};
  }

  render() {
      debug('Props', this.props);
      const { value } = this.props;

      return (
        <Card className="text-white bg-info">
              <CardBody className="pb-0">
                <ButtonGroup className="float-right">
                  <ButtonDropdown id='card1' isOpen={this.state.card1} toggle={() => { this.setState({ card1: !this.state.card1 }); }}>
                    <DropdownToggle caret className="p-0" color="transparent">
                      <i className="icon-settings"></i>
                    </DropdownToggle>
                    <DropdownMenu right>
                      <DropdownItem>Action</DropdownItem>
                      <DropdownItem>Another action</DropdownItem>
                      <DropdownItem disabled>Disabled action</DropdownItem>
                      <DropdownItem>Something else here</DropdownItem>
                    </DropdownMenu>
                  </ButtonDropdown>
                </ButtonGroup>
                <div className="text-value">{value.amount}</div>
                <div>{value.description}</div>
              </CardBody>
        </Card>
      )
  }
}


