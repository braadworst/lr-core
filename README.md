# lr-main reference

The _lr-main_ package is the only mandatory package for Lagoon road. This package connects everything together, regardless of environment.

| Information | - |
| ----------- | - |
| Code coverage | [![Coverage Status](https://coveralls.io/repos/github/lagoon-road/lr-main/badge.svg?branch=master)](https://coveralls.io/github/lagoon-road/lr-main?branch=master) |
| Repo link | [lr-main](https://github.com/lagoon-road/lr-main) |
| Dependencies | [check-types](https://github.com/philbooth/check-types.js) |
| Size (Browserify, Babel and Gzip)| 6.9KB |
| Version | 1.0.0 |
| License | MIT |
| Usage | [guide](https://lagoonroad.com/guide) |

---

### core(environmentId, [options])
```
const core = require('lr-main');
const road = core('webserver');
```
**environmentId:string**  
The primary environment id for the road, this is the executing environment that will be used when an update event is fired.

**[options.resetAfterCycle:boolean]**  
By default the relay object gets cleared after an update event of the road, sometimes, mainly on the client, you want to keep the relay populated even if an update event has ran. To do so, you can set this boolean to  _false_

---

### road.parser(parser)
```
const parser = require('lr-url-parser')();
road.parser(parser);
```
**parser:object**  
The parser that you want to use to parse an incoming matchValue. It expects two functions in the object, `add` and `parse`. Read more about parsers in the [guide](https://lagoonroad.com/guide/writing-parsers)

---

### road.extension(extensionId, extension, [isUpdater])
```
road.extension('router', router, true);
```
**extensionId:string**  
A unique id to identify the extension.

**extension:\***  
The actual extension, this can be any type of code that you want to use

**[isUpdater:boolean = false]**  
Tell the core if on initialization the extension needs to be executed. This is typically for extensions that use update events to trigger updates to the road. Read more about [extensions](https://lagoonroad.com/guide/writing-extensions) in the guide.

> Extensions can be used in middleware via the relay object.
> ```
> module.exports = (next, relay) => {
>   console.log(relay.extensions.extensionName);
>   next();
> }
>```

---

### road.middleware(middleware, [...traditional])
```
road.middleware({ bodyParser, response }, 'bodyParser', 'response');
```
**middleware:object**  
An object with all the middleware you want to use. This is a single depth object so don't use any nested structures.

> Middleware methods can be called multiple times, the middleware will all be added to a single object within the core. Therefore you need to supply unique ids/keys.
> If you have a multitude of middleware functions that you  want to use it might be handy to use a dot notation to  group your middleware.
> ```
> road.middleware({
>   'component.navigation' : require('...'),  
>   'component.home'       : require('...'),  
> });
> ```

**traditional:string**
The middleware id of the middleware that you want to run in traditional mode. The relay object wil _not_ be passed in. The traditional function signature looks as follows:
```
// traditional, error is optional
(request, response, next, error) => {}
```
---

### road.where(environmentId, [...environmentId])

```
road.where('webserver', 'client');
```

**environmentId**  
The where method expects at least one argument, which should be a string. This is an environment id to which all the following middleware will be assigned. If you want to assign middleware to multiple environments you can just specify several ids like in the example above.

---

### road.run(matchValue, middlewareId, [matchValue])

```
road.run('*', 'log');
```

**matchValue:string**  
A match value in most webapps can be thought of as an url path, but it is not limited to paths only. Frankly it can be any string you can think of, even a JSON string to match on JSON content. Or in an even more exotic example you can match Raspberry Pie sensor outputs via an extension to string values and let that trigger middleware. You can use the `*` as a wildcard to match on all match values that might come in.

**middlewareId:string**  
Identifier you added by using the `middleware` method. It needs to be a string and should match to a middleware function, otherwise it will throw an error.

**[updateType:string]**  
The update type is an extra layer for matching middleware, if we use a http protocol to update the road, this will be the method for the request. By default it wil be `GET` because it is the most common, but it can be overwritten to be something else. Again you are not limited to http methods, it fully depends on what an extension sends out via an update event.

---

### road.error(middlewareId, [updateType])

```
road.error('log')
```

_Whenever the stack of middleware that is updated throws an error, it will be redirected to error middleware. You can use it to render alternative content or log the errors. The `relay` object will have a new property `relay.error` with the error message._

**middlewareId:string**  
Identifier you added by using the `middleware` method. It needs to be a string and should match to a middleware function, otherwise it will throw.

**[updateType:string]**  
The update type is an extra layer for matching middleware, if we use a http protocol to update the road, this will be the method for the request. By default it wil be `GET` because it is the most common, but it can be overwritten to be something else. Again you are not limited to http methods, it fully depends on what an extension sends out via an update event.

---

### road.noMatch(middlewareId, [updateType])

```
road.noMatch('log');
```

_When no middleware could be found for a current combination of `matchValue` and `updateType`, the `noMatch` middleware will be called, this is handy if you want to return a 404 page or something similar._

**middlewareId:string**  
Identifier you added by using the `middleware` method. It needs to be a string and should match to a middleware function, otherwise it will throw.

**[updateType:string]**  
The update type is an extra layer for matching middleware, if we use a http protocol to update the road, this will be the method for the request. By default it wil be `GET` because it is the most common, but it can be overwritten to be something else. Again you are not limited to http methods, it fully depends on what an extension sends out via an update event.

---

### road.done(middlewareId, [updateType])

```
road.done('response', 'post');
```

_The `done` method is called as the last method in the stack, it is typically used to render output (html or json) to a client_

**middlewareId:string**  
Identifier you added by using the `middleware` method. It needs to be a string and should match to a middleware function, otherwise it will throw.

**[updateType:string]**  
The update type is an extra layer for matching middleware, if we use a http protocol to update the road, this will be the method for the request. By default it wil be `GET` because it is the most common, but it can be overwritten to be something else. Again you are not limited to http methods, it fully depends on what an extension sends out via an update event.

---

### road.update(options:object, [...parameters])

```
road.update({ matchValue : '/somepath', updateType : 'post' }, parameterOne, parameterTwo);
```
_Manually trigger an update event to the road by calling the `update` method._

**options.matchValue:string**  
A match value in most webapps can be thought of as an url path, but it is not limited to paths only. Frankly it can be any string you can think of, even a JSON string to match on JSON content. Or in an even more exotic example you can match Raspberry pie sensor outputs via an extension to string values and let that trigger middleware. You can use the `*` as a wildcard to match on all match values that might come in.

**options.updateType:string**  
The update type is an extra layer for matching middleware, if we use a http protocol to update the road, this will be the method for the request. By default it wil be `GET` because it is the most common, but it can be overwritten to be something else. Again you are not limited to http methods, it fully depends on what an extension sends out via an update event.

**parameters:\***  
Each update can be have custom parameters that will be available as middleware arguments. This could be for example the `request` and `response` object on a router update.

> Read more about parameters in the [update and middleware stack](https://lagoonroad.com/guide/update-and-middleware-stack) section.
> Every time a update method is called the middleware that matches will be added to the stack of middleware that needs to be executed. So when calling this on the server you might send out a response and afterwards more middleware will be called. Therefore use it on the client mainly to initialize events. Make sure you fully understand the middelware stack before start using the update function.

## Relay object
The relay object is passed from middleware function to middleware function. There are a couple of properties and methods in this object that cannot be overwritten. If you will try to do so, Lagoon road will throw an error to warn you of naming conflicts.

### relay.extensions:object
An Object that has all the registered extensions in it. This way all extensions will not get scattered all over the object.

### relay.parameters:object
If you are using a parser that supplies you with parameters like `lr-url-parser`, you can access them via `relay.parameters`.

### relay.update(options:object):function
See update method for usage.

### relay.exit():function
When you want to prematurely finish the update cycle you have to call the `exit()` function. You want to use this when you want to send a `response.end` before the `done` hook. This function should be used rarely, read more about it in the [stack](https://lagoonroad.com/guide/update-and-middleware-stack) and [static content](https://lagoonroad.com/guide/handling-static-content) guides.
