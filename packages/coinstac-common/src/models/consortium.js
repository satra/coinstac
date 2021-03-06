'use strict';

const PouchDocument = require('./pouch-document.js');
const joi = require('joi');

/**
 * @constructor
 * @class Consortium
 * @description defines a group of users with a common objective.
 * @extends PouchDocument
 * @param {string} description long description of consortium
 * @param {string} label short description of consortium
 * @param {string[]} tags @deprecated
 * @param {string[]} users username array of members
 * @param {string[]} owners those who can kickoff a DecentralizedComputation
 *                          and manage consortium properties
 */
class Consortium extends PouchDocument {

  /**
   * @description Test whether username is a member of consortium (case insensitive)
   * @param  {string} username
   * @returns {boolean}          true if username is member
   */
  hasMember(username) {
    return this.users.some(Consortium.compareUsernames.bind(null, username));
  }

  /**
   * @description Test whether username is an owner of the consortium (case insensitive)
   * @param  {string} username
   * @returns {boolean}          true if username is an owner. false otherwise
   */
  isOwnedBy(username) {
    if (this.owners && this.owners.length) {
      return this.owners.some(Consortium.compareUsernames.bind(null, username));
    }

    return false;
  }

}

/**
 * compare two usernames in a case-insensitive way
 * @param  {string} uname1
 * @param  {string} uname2
 * @return {boolean} true if the names match
 */
Consortium.compareUsernames = function (uname1, uname2) {
  return uname1.toLowerCase().trim() === uname2.toLowerCase().trim();
};

Consortium.schema = Object.assign({}, PouchDocument.schema, {
  _id: joi.string().regex(/^[a-zA-Z0-9]+$/),
  activeComputationId: joi.string().min(1),
  activeRunId: joi.string().min(1),
  description: joi.string().required(),
  label: joi.string().min(1).required(),
  tags: joi.array().default([]),
  users: joi.array().items(joi.string()).required().default([]), // @TODO users => usernames
  owners: joi.array().items(joi.string()).required(),
});
module.exports = Consortium;
