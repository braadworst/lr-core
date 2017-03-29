const check = require('check-types');
const flat  = require('flat');

module.exports = environmentId => {
  let environmentsInUse,
      environments        = {},
      availableMiddleware = {},
      extensions          = {};

  const exposed = {
    extension,
    middleware,
    where,
    path,
    run,
    runCustom,
    once,
    error,
    noMatch,
    done
  };

  environment(environmentId);

  function environment(id) {
    check.assert.not.undefined(id, 'Environment id cannot be empty');
    check.assert.match(id, /^[a-zA-Z0-9]*$/, 'Environment id needs to be a string containing only letters and or numbers');
    check.assert.not.assigned(environments[id], `${ id } has already be defined as an environment`);
    environments[id] = { paths : {}, noMatch : [], error : [], done : [] };
    return exposed;
  }

  function extension(id, extension, isUpdater = false) {
    check.assert.not.undefined(id, 'Extension id cannot be empty');
    check.assert.not.undefined(extension, 'Extension cannot be empty');
    check.assert.match(id, /^[a-zA-Z0-9]*$/, 'Extension id needs to be a string containing only letters and or numbers');
    check.assert.not.assigned(extensions[id], `${ id } has already be defined as an extension`);
    extensions[id] = isUpdater ? extension(update, { environments : environmentsInUse }) : extension;
    return exposed;
  }

  function middleware(newMiddleware) {
    check.assert.not.undefined(newMiddleware, 'Middleware cannot be empty');
    check.assert.nonEmptyObject(newMiddleware, 'Provided middleware needs to be a non empty object');
    newMiddleware = flat(newMiddleware);
    Object.keys(newMiddleware).forEach(id => {
      check.assert.not.assigned(availableMiddleware[id], `${ id } has already be defined as middleware`);
    });
    availableMiddleware = Object.assign({}, availableMiddleware, newMiddleware);
    return exposed;
  }

  function where(...environmentIds) {
    check.assert.greater(environmentIds.length, 0, 'Where method missing parameters');
    environmentIds.forEach(id => {
      check.assert.match(id, /^[a-zA-Z0-9]*$/, 'Environment id needs to be a string containing only letters and or numbers');
      check.assert.assigned(environments[id]);
    });
    environmentsInUse = environmentIds.forEach(id => environments[id]);
    return exposed;
  }

  function path(id, ...values) {
    check.assert.not.undefined(id, 'Path id cannot be empty');
    check.assert.greater(values.length, 0, 'Please provide at least one value for your path');
    check.assert.match(id, /^[a-zA-Z0-9]*$/, 'Path id needs to be a string containing only letters and or numbers');
    values.forEach(value => {
      check.assert.match(value, /^[a-zA-Z0-9]*$/, 'Path id needs to be a string containing only letters and or numbers');
    });
    environmentsInUse.forEach(environment => {
      check.assert.not.assigned(environment.paths[id], `${ id } has already been defined`);
      environment.paths[id] = { values : [], middleware : [], once : false, type : 'default' };
      environment.paths[id].values = values.reduce((reduced, value) => {
        const group = environment[value] ? environment[value].values : [value];
        return [...reduced, ...group];
      }, []);
    });
    return exposed;
  }

  function run(pathId, middlewareId) {
    add(pathId, middlewareId, 'default');
    return exposed;
  }

  function runCustom(pathId, middlewareId, updateType) {
    add(pathId, middlewareId, updateType);
    return exposed;
  }

  function once(pathId, middlewareId) {
    add(pathId, middlewareId, 'default', true);
    return exposed;
  }

  function error(middlewareId) {
    check.assert.not.undefined(middlewareId, 'Middleware id cannot be empty');
    check.assert.match(middlewareId, /^[a-zA-Z0-9]*$/, 'Middleware id needs to be a string containing only letters and or numbers');
    environmentsInUse.forEach(environment => environment.error.push(middlewareId));
  }

  function noMatch(middlewareId) {
    check.assert.not.undefined(middlewareId, 'Middleware id cannot be empty');
    check.assert.match(middlewareId, /^[a-zA-Z0-9]*$/, 'Middleware id needs to be a string containing only letters and or numbers');
    environmentsInUse.forEach(environment => environment.noMatch.push(middlewareId));
  }

  function done(middlewareId) {
    check.assert.not.undefined(middlewareId, 'Middleware id cannot be empty');
    check.assert.match(middlewareId, /^[a-zA-Z0-9]*$/, 'Middleware id needs to be a string containing only letters and or numbers');
    environmentsInUse.forEach(environment => environment.done.push(middlewareId));
  }

  function add(pathId, middlewareId, updateType, once = false) {
    check.assert.not.undefined(pathId, 'Path id cannot be empty');
    check.assert.not.undefined(middlewareId, 'Middleware id cannot be empty');
    check.assert.not.undefined(updateType, 'Update type cannot be empty');
    check.assert.match(pathId, /^[a-zA-Z0-9]*$/, 'Path id needs to be a string containing only letters and or numbers');
    check.assert.match(middlewareId, /^[a-zA-Z0-9]*$/, 'Middleware id needs to be a string containing only letters and or numbers');
    check.assert.match(updateType, /^[a-zA-Z0-9]*$/, 'Update type needs to be a string containing only letters and or numbers');
    if (pathId.indexOf('*') > -1) {
      check.assert.equal(pathId.length, 1, 'Path id needs to be * only or a path id not both');
    }

    environmentsInUse.forEach(environment => {
      const asArray = Object.keys(environment.paths);

      function set(id) {
        environment.paths[id].middleware.push(middlewareId);
        environment.paths[id].eventType = eventType;
        environment.paths[id].once      = once;
      }

      if (pathId === '*') {
        asArray.forEach(set);
      } else if (pathId[0] === '-') {
        pathId = pathId.slice(1);
        check.assert.assigned(environment.paths[pathId], `Path ${ pathId } not found`);
        asArray
          .filter(key => key !== pathId)
          .forEach(set);
      } else {
        check.assert.assigned(environment.paths[pathId], `Path ${ pathId } not found`);
        set(pathId);
      }
    });
  }

  // function update(options, ...parameters) {
  //
  //   ({ environmentsToUpdate, method, path } = options);
  //
  //   check.assert.assigned(environmentsToUpdate, 'Please provide environments to update');
  //   check.assert.assigned(method, 'Please provide a method name');
  //   check.assert.assigned(path, 'Please provide a path name');
  //   check.assert.nonEmptyString(method, 'Method needs to be of type string');
  //   check.assert.nonEmptyString(path, 'Path needs to be of type string');
  //   check.assert.positive(environmentsToUpdate.length - 1, 'Provide at least one environment name');
  //   check.assert.array.of.nonEmptyString(environmentsToUpdate, 'All supplied environment names need to be a string');
  //
  //   options.method = options.method.toLowerCase();
  //   environmentsToUpdate.forEach(environment => {
  //     if (environments[environment]) {
  //       const middleware = environments[environment].middleware;
  //       const names = options.path[0] === '/' ? environments[environment].pathsByPath[options.path] : [options.path];
  //       const stack = middleware
  //         // .filter(record => listeners[options.method].indexOf(record.method) > -1)
  //         .filter(record => record.names.filter(name => names.indexOf(name) > -1).length > 0);
  //
  //       let relay = {};
  //       function thunkify(middleware) {
  //         if (!middleware) { return function last() {}; }
  //         if (typeof middleware.callback !== 'function') {
  //           console.log(middleware);
  //           throw new Error('Middleware needs to be a function');
  //         }
  //         return function(defined) {
  //           isObject(defined);
  //           relay = Object.assign({}, relay, defined)
  //           console.log('calling middleware:', middleware.name);
  //           middleware.callback(
  //             thunkify(stack.shift()),
  //             relay,
  //             ...parameters
  //           );
  //         }
  //       }
  //
  //       try {
  //         thunkify(stack.shift())(extensions);
  //       } catch (error) {
  //         console.log('road had an error');
  //         console.log(error);
  //       }
  //     }
  //   });
  // }

  return exposed;
};
