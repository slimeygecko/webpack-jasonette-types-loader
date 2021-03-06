var  Module = require("module");
var get = require('lodash.get');

function exec(code, filename) {
    var module = new Module(filename, this);
    module.paths = Module._nodeModulePaths(this.context);
    module.filename = filename;
    module._compile(code, filename);
    return module.exports;
}

function needsTransformation(obj) {
    return obj && !Array.isArray(obj) && obj.operator && obj.name && obj.object;
}

function transform(transformable) {
    if (!needsTransformation(transformable)) {
        return transformable;
    }
    
    var obj = {};
    var propName = '{{' + transformable.operator + ' ' + transformable.name + '}}';
    obj[propName] = transformable.object;

    if (needsTransformation(obj[propName])) {
        obj[propName] = transform(obj[propName]);
    }

    return obj;
}

module.exports = function(source) {
    this.cacheable && this.cacheable();

    var result = exec.call(this, source, this.resourcePath);
    if (result.__esModule) {
        delete result.__esModule;
    }

    var sectionsPath = 'default.$jason.head.templates.body.sections';
    var sections = get(result, sectionsPath);
    if (sections && Array.isArray(sections)) {
        result[sectionsPath] = sections.map(function(section) {
            // return Object.assign({}, section, {
            //     items: transform(section.items)
            // });
            section.items = transform(section.items);
            
            return section;
        });
    }

	return JSON.stringify(result.default || result);
}