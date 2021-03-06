import { Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import React, { Component, PropTypes } from 'react';

class FormLogin extends Component {
  data() {
    return {
      username: findDOMNode(this.refs.username).value,
      password: findDOMNode(this.refs.password).value,
    };
  }
  render() {
    const { loading, submit } = this.props;
    const isDev = process.env.NODE_ENV = 'development';
    let devButtons;

    if (isDev) {
      devButtons = (
        <Button
          bsStyle="warning"
          type="button"
          disabled={loading.isLoading}
          onClick={ this.props.hotRoute }
          block>Hot Route</Button>
      )
    }

    return (
      <div>
        <div className="panel panel-default">
          <div className="panel-body">
            <form onSubmit={submit}>
              <FormGroup controlId="login-username">
                <ControlLabel>Username:</ControlLabel>
                <FormControl
                  ref="username"
                  type="text" />
              </FormGroup>
              <FormGroup controlId="login-password">
                <ControlLabel>Password:</ControlLabel>
                <FormControl
                  ref="password"
                  type="password" />
              </FormGroup>
              <Button
                bsStyle="primary"
                type="submit"
                disabled={loading.isLoading}
                block>Log In</Button>
              {devButtons}
            </form>
          </div>
        </div>
        <Button bsStyle="link" block>Forgot Password?</Button>
      </div>
    );
  }
};

FormLogin.propTypes = {
  submit: PropTypes.func.isRequired,
  loading: PropTypes.object,
};

export default FormLogin;

