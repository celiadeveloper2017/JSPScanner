
var fs=require('fs');
var update_path='./webroot/translation/';
var gulp=require('gulp');
var dom=require('gulp-dom'),
    replace=require('gulp-replace-assets'),
    scan_path = './webroot/',
concat = require('gulp-concat'),
    typeArr=['span', 'label', 'input', 'button', 'a', 'div','td', 'b'],
    bypassArr=[],
    noPrefixArr=[],
    byPassAssignId=[],
    skipArr=[];

function keyScanner() {

    var getReplaceBundle = function (destPath, toBeUpdated, afterUpdatedArr) {
        var prefix = '';
        var levels = destPath.split('/');
        var replaceThis = {};
        var afterUpdated = afterUpdatedArr ? afterUpdatedArr : [];
        if (levels.length > 1) {
            for (var i = 1; i < levels.length - 1; i++) {
                levels[i] = levels[i].trim().replace(/\s/g, '');
                prefix += levels[i] + ':';
            }
        }
        prefix = prefix.substr(0, prefix.length - 1);
        if (prefix)prefix += levels[levels.length - 1] + '.';
        if (toBeUpdated.length) {
            for (var j = 0; j < toBeUpdated.length; j++) {
                //    console.log("key:"+toBeUpdated[j]);
                if (toBeUpdated[j].trim().replace(/\s/g, '')) {
                    if (!afterUpdated[j])afterUpdated[j] = toBeUpdated[j].indexOf(prefix) != -1 ? toBeUpdated[j] : prefix + toBeUpdated[j];
                    console.log(afterUpdated[j]);
                    replaceThis[toBeUpdated[j]] = afterUpdated[j];
                }
            }
        }
        return replaceThis;
    }
    var getReplaceBundle2 = function (toBeUpdated, update) {
        var afterProcessed = {};
        if (toBeUpdated.length) {
            toBeUpdated.forEach(function (id) {
                id = id.trim().replace(/\s/g, '');
                if (id) {
                    if (id.indexOf('>') != -1) {
                        var temp = id.split('>');
                        if (id.split('>').length) {
                            var temp = [];
                            var namespace = temp[0];
                            id = temp[1];
                            afterProcessed[id] = update;
                        }


                    } else {
                        afterProcessed[id] = update;
                    }

                }
            })
        }
        return afterProcessed;
    }
    var updateJS = function (toBeUpdated, path, fileName, prefix) {
        var toBeUpdated_js = [];
        var afterUpdated_js = [];
        //  console.log(file.substr(0, file.length-4));
        var destPath = '';
        console.log(prefix);
        if (path.indexOf('./webroot/') != -1) {
            destPath = path.substr(path.indexOf('./webroot/') + 9);
        }
        // var fileName = file.substr(0, file.length-4);
        try {
            fs.readFile(path + fileName + '.js', 'utf-8', function (err, data) {
                if (err) {
                    //        console.log(path + fileName + '.js' + "not exist");
                    return;
                }
                if (data.length) {
                    var lines = data.split("\n");
                    for (var i = 0; i < lines.length; i++) {
                        //  console.log(lines[i]);
                        var src1 = lines[i].match(/document.getElementById\(([^)]+)\)/g);
                        var src2 = lines[i].match(/new(\s)ESButton\(([^)]+)\)/g);
                        var src = [];
                        if (src1)src = src.concat(src1);
                        if (src2)src = src.concat(src2);
                        if (src && src.length) {
                            src.forEach(function (elem) {
                                //     console.log(path+fileName+'.js'+'match id:'+elem);
                                if (toBeUpdated.length) {

                                    toBeUpdated.forEach(function (id) {
                                        var jsUpdate = '';
                                        if (id.trim().replace(/\s/g, '')) {
                                            id = id.trim();
                                            if (elem.indexOf(id) != -1) {
                                                console.log("id:" + id);
                                                if (id.indexOf(prefix) == -1 && elem.indexOf(prefix + id) == -1) {
                                                    toBeUpdated_js.push(elem.trim());
                                                    console.log('toBeUpdated:' + elem.trim());
                                                    elem = elem.trim();
                                                    jsUpdate = elem.substr(0, elem.indexOf(id)) + prefix + id + elem.substr(elem.indexOf(id) + id.length);
                                                    afterUpdated_js.push(jsUpdate);
                                                    console.log("afterProcess:" + jsUpdate);
                                                }
                                            } else if (id.trim().indexOf(prefix) != -1 && elem.indexOf(id.trim().substr(prefix.length)) != -1) {
                                                console.log("id:" + id.trim().substr(prefix.length));
                                                console.log("with prefix: toBeUpdated:" + elem.trim());
                                                //  console.log("id:" + id.trim().substr(id.indexOf(prefix),id.indexOf(prefix)+ prefix.length));
                                                toBeUpdated_js.push(elem.trim());
                                                jsUpdate = elem.substr(0, elem.indexOf(id.substr(0, prefix.length))) + id + elem.substr(elem.indexOf(id.substr(prefix.length)) + id.substr(prefix.length).length);
                                                afterUpdated_js.push(jsUpdate);
                                                console.log("with prefix afterProcess:" + jsUpdate);
                                            }
                                        }
                                    })
                                }

                            })


                        }

                    }
                    if (toBeUpdated_js.length) {
                        toBeUpdated_js.forEach((function (id) {
                            console.log('toBeupdated_js' + ":" + id);
                        }))
                        var replaceBundleJS = getReplaceBundle(destPath, toBeUpdated_js, afterUpdated_js);
                        if (replaceBundleJS && replaceBundleJS.length) {
                            //     console.log("replaceBundleJS:"+replaceBundleJS);
                        }
                        gulp.src(path + fileName + '.js').pipe(replace(replaceBundleJS)).pipe(gulp.dest(update_path + destPath));
                    }
                }
            })
        } catch (e) {
            console.log("catch:" + e);
        }


    }
    var processHtml = function (text) {
        var res = text.toString().trim().replace(/\t+\r+\s+/g, '\n').replace(/\n+/g, '[S]')
            .replace(/-|%(.*?)|(.*?)%|&gt|ellipsis|&lt|;|<(.*?)>(.*?)<(.*?)>|<(.*?)>|<(.*?)|(.*?)>|>(.*?)/g, '').replace(/\[S\]+/g, ' ').replace(/\s+/g, ' ');
        return res;
    }
    var scanElement = function (type, doc, prop_prefix, prefix, callback) {

        var toBeUpdated = [];
        var inputStream = '';
        var needToAddId = false;
        if (doc && doc.getElementsByTagName(type).length) {
            var list = doc.getElementsByTagName(type);

            for (var i = 0; i < list.length; i++) {
                var str = '';
                if (list[i].id) {
                    // if(list[i].htmlFor)console.log(list[i].htmlFor);
                    var id_text = list[i].id.trim().replace(/\s/g, '');
                    var html = '';
                    if (list[i].innerHTML) {
                        var text = processHtml(list[i].innerHTML);
                        if (text.trim()) {
                            html = text.trim();
                        }
                    } else {
                        if (list[i].value && list[i].value.toString().trim()) {
                            html = list[i].value.toString().trim();
                        }
                    }
                    console.log(id_text);
                    console.log(html);
                    if (id_text && html) {
                        var checkNBS = html.trim().replace(/&nbsp|\s+/g, '');
                        if (checkNBS && !(bypassArr.includes(id_text) || bypassArr.includes(id_text.substr(prop_prefix.length)))
                            && !id_text.match(/<%(.*?)%>/g)) {
                            if (checkNBS.replace('.', '').trim()) {
                                if (noPrefixArr.includes(id_text) || noPrefixArr.includes(id_text.substr(prop_prefix.length))) {
                                    str += id_text;
                                } else {
                                    toBeUpdated.push(id_text);
                                    if (id_text.indexOf(prop_prefix) != -1) {
                                        str += prefix + id_text.substr(prop_prefix.length);
                                    } else {
                                        str += prefix + id_text;
                                    }
                                }
                                str += '=' + html;
                            }

                        }

                    }


                } else {
                    var content = list[i].innerHTML ? processHtml(list[i].innerHTML) : list[i].value ? list[i].value.toString().trim() : '';
                    var checkContent = content.replace(/&nbsp|;|\s/g, '');

                    if (checkContent) {
                        if (!needToAddId)needToAddId = true;
                    }
                }
                if (str) {
                    if (str.substr(-1) === '=')str = str.substr(0, str.length - 1);
                    str += '|';
                    //   str.replace(/&gt|&gt|ellipsis|%/g,'');
                    inputStream += str;
                }
                typeArr.forEach(function (type) {
                    if (list[i].getElementsByTagName(type).length) {
                        // console.log(list[i].getElementsByTagName(type));
                        scanElement(type, list[i], prop_prefix, prefix, function (keys, props, isAddingId) {
                            if (keys && keys.length) {
                                //   console.log( type+'-data:'+data);
                                keys.forEach(function (k) {
                                    //     console.log("recursive:"+k);
                                })
                                toBeUpdated = toBeUpdated.concat(keys);

                            }
                            if (props && props.length) {
                                inputStream += props;
                            }
                            needToAddId = isAddingId;

                        })
                    }
                    //  if(!--pending)return callback(toBeUpdated, inputStream);
                })


            }
        }

        return callback(toBeUpdated, inputStream, needToAddId);
    }
    var scan = function (path, file) {
        var destPath = '';
        var replaceBundle = {};
        var prefix = '';
        var prop_prefix = '';
        var needToAddId = false;
        if (path.indexOf('./webroot/') != -1) {
            destPath = path.substr(path.indexOf('./webroot/') + 9);
        }
        var levels = destPath.split('/');
        if (levels.length > 1) {
            for (var i = 1; i < levels.length - 1; i++) {
                levels[i] = levels[i].trim().replace(/\s/g, '');
                prefix += levels[i] + '>';
                prop_prefix += levels[i] + ':';
            }
            prefix = prefix.substr(0, prefix.length - 1);
            prop_prefix = prop_prefix.substring(0, prop_prefix.length - 1);
            if (prefix.trim())prefix += levels[levels.length - 1] + '.';
            if (prop_prefix.trim())prop_prefix += levels[levels.length - 1] + '.';
            //     console.log('prefix:'+prefix);
        }
        if (file) {
            //  console.log("FileArray:"+file);
            gulp.src(path + file).pipe(dom(function () {
                var keys = [];
                var inputStream = '';
                var tempBundle = {};

                var self = this;

                scanElement('table', self, prop_prefix, prefix, function (k, p, n) {
                    if (k && k.length) {
                        k.forEach(function (item) {
                            //       console.log("key"+item);
                        })
                        keys = k;
                    }
                    if (p) {
                        //    console.log(p);
                        inputStream += p;
                    }
                    if (n == true) {
                        needToAddId = n;
                    }

                });
                if (keys.length) {
                    tempBundle = getReplaceBundle(destPath, keys);
                    //   tempBundle =getReplaceBundle(keys);
                    //    var fileName = file.substr(0, file.length-4);
                    //    var exists=fs.existsSync(path+fileName+'.js');
                    //    var exists2=fs.existsSync(path+fileName+'_fields.js');
                    // console.log(exists);
                    //    if(exists){
                    //       try{
                    //           updateJS(keys,path, fileName, prop_prefix);
                    //        }catch(e){
                    //            console.log('updateJS:'+e);
                    //        }
                    //    }
                    //    if(exists2){
                    //        try{
                    //            updateJS(keys,path, fileName+'_fields', prop_prefix);
                    //       }catch(e){
                    //            console.log('updateJS:'+e);
                    //        }
                    //    }
                }


                Object.assign(replaceBundle, tempBundle);
                //      console.log(inputStream);
                return inputStream;
            }, false)).pipe(concat(file + '.txt'))
                .pipe(gulp.dest(update_path + destPath));
            console.log("replaceBundle:" + replaceBundle);
            //   assignIds(path, file, prop_prefix);
            if (!skipArr.includes(file)) {
                if (path != scan_path || byPassAssignId.includes(file)) {
                    replaceSnippet(path, file);
                }
            }
            gulp.src(path + file).pipe(replace(replaceBundle)).pipe(gulp.dest(update_path + destPath));

        }
    };
    var postProcessJSP = function (doc, includes) {
        var header = doc.header ? doc.header.innerHTML : '';
        var body = doc.body ? doc.body.innerHTML : '';
        var temp = '';
        var body_context = '';
        var jsInclude = '';
        var processed_body = body ? body.replace(/\n+/g, '[S]').replace(/<script(.*?)>|(.*?)<\/script>|<link(.*?)>(.*?)>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\[S\]+/g, '\n') : '';
        console.log("processed_body"+processed_body);
        var self = doc.documentElement.innerHTML;

        var documentTag = self.match(/DOCTYPE/g);
        if (documentTag && documentTag.length) {
            console.log(documentTag[0]);
        }
        // console.log(self);
        var snippets = self.replace(/\n+/g, '[s]').replace(/<script(.*?)>(.*?)<\/script>|<link(.*?)>(.*?)>|<table(.*?)>(.*?)<\/table>|<div(.*?)>(.*?)<\/div>|&lt;%@(.*?)&gt;/g, '').match(/&lt;%(?!=)(.*?)%&gt;/g);
        var snippetsJsp = '';
        if (snippets && snippets.length) {
            snippets.forEach(function (snp) {
                console.log("snippets:" + snp);
                var lines = snp.split('[s]');
                if (lines.length) {
                    lines.forEach(function (line) {
                        if (line.trim().replace(/&lt;|&gt;|-|ellipsis|=|/g, '')) {
                            snippetsJsp += line.trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                            snippetsJsp += '\n';
                        }

                    })
                }
            })
        }
        //   console.log("snippets:"+snippets);
        if (body) {
            temp = self.match(/<body(.*?)>/g);
            if (temp && temp.length) {
                body_context = temp[0].trim();

            }
        }
        //     if(body_context)processed_body=body_context+processed_body+'</body>';


        var that = self.trim().replace(/\n+/g, '[space]');
        var ahead = that.replace(/<table(.*?)>(.*?)<\/table>|<div(.*?)>(.*?)<\/div>/g, '');
        var imports = ahead.match(/&lt;%@(.*?)&gt;/g);
        var scripts = that.match(/<script(.*?)>(.*?)<\/script>/g);
        var styles = that.match(/<style(.*?)>(.*?)<\/style>/g);
        var links = self.match(/<link(.*?)>(.*?)>/g);
        var title = '';
        if(that.match(/<title(.*?)>(.*?)<\/title>/g)){
            title=that.match(/<title(.*?)>(.*?)<\/title>/g)[0];
        };
        var metas = that.match(/<meta(.*?)>/g);
        var jspImports = '';
        var jspScripts = '';
        var jspStyles = '';
        var jspLinks = '';
        var jspMeta = '';
        var jspTags = self.trim().match(/<jsp(.*?)>/g);
        if (imports && imports.length) {
            imports.forEach(function (imp) {

                imp = imp.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                //  console.log(imp);
                imp=imp.replace(/<%=(.*?)%>/g,'');
                if(imp.trim()){
                    if (imp.indexOf('js-include') != -1) {
                        jsInclude = imp + '\n';
                    } else {
                        jspImports += imp + '\n';
                    }
                }


            })
        }
        if (scripts && scripts.length) {
            scripts.forEach(function (scp) {
                //  console.log(scp);
                var lines = scp.split('[space]');
                if (lines.length) {
                    lines.forEach(function (line) {
                        jspScripts += line.trim();
                        jspScripts += '\n';
                    })
                }

            })
        }
        if (styles && styles.length) {
            styles.forEach(function (scp) {
                //  console.log(scp);
                var lines = scp.split('[space]');
                if (lines.length) {
                    lines.forEach(function (line) {
                        jspStyles += line.trim();
                        jspStyles += '\n';
                    })
                }

            })
        }
        if (metas && metas.length) {
            metas.forEach(function (meta) {
                var lines = meta.split('[space]');
                if (lines.length) {
                    lines.forEach(function (line) {
                        jspMeta += line.trim();
                        jspMeta += '\n';
                    })
                }
            })
        }
        if (links && links.length) {
            links.forEach(function (lk) {
                // console.log(lk);
                jspLinks += lk + '\n';
            })
        }
        if (processed_body) {


            if (jspTags && jspTags.length) {
                jspTags.forEach(function (jsp) {
                    if (jsp.trim()) {
                        jsp = jsp.trim();

                        var replaceJsp = jsp.substr(0, jsp.length - 1) + '/>';
                        processed_body = processed_body.replace(jsp, replaceJsp).replace(/<\/jsp(.*?)>/g, '');
                    }
                })
            }

        }
        if (jspLinks || jspScripts || jspStyles) {
            header = '<head>' + '\n' + title + '\n' + jspMeta + jspStyles + jspLinks + jsInclude + jspScripts + '</head>' + '\n';
            if (body_context && body_context != '<body>') {
                processed_body = body_context + processed_body + '\n' + '</body>' + '\n';
            }
        }

        var newPage = '';

        if (header) {
            newPage = jspImports + includes + '\n' + snippetsJsp + '<html>' + '\n' + header + '\n' + processed_body + '</html>';
        } else {
            newPage = jspImports + includes + '\n' + snippetsJsp + processed_body;
        }
        return newPage;
    }

    var assignIds = function (path, file, prefix) {
        if (file) {
            gulp.src(path + file).pipe(dom(function () {
                var self = this;
                typeArr.forEach(function (type) {
                    if (self && self.getElementsByTagName(type)) {
                        var list = self.getElementsByTagName(type);
                        for (var i = 0; i < list.length; i++) {
                            if (!list[i].id) {
                                if (list[i].innerHTML && processHtml(list[i].innerHTML) || list[i].value && list[i].value.toString().trim()) {

                                    var content = list[i].innerHTML ? processHtml(list[i].innerHTML) : list[i].value ? list[i].value.toString().trim() : '';
                                    content = content.replace(/&nbsp|;|\s/g, '');
                                    var assignId = '';
                                    if (content.replace(/\W|\d/g, '')) {
                                        var words = content.split(" ");
                                        if (words.length) {
                                            words.forEach(function (word) {
                                                if (word.trim()) {
                                                    word = word.trim().replace(/\W|:/g, '');
                                                    assignId += word + '_';
                                                }
                                            })
                                        }
                                        if (assignId) {
                                            if (assignId.length > 30)assignId = assignId.substr(0, 30);
                                            assignId = prefix + assignId + type + '_' + i;
                                            // newIds.push(assignId);

                                            list[i].setAttribute('id', assignId);


                                        }
                                    }

                                }
                            }
                        }
                    }
                })

                return postProcessJSP(this);
            })).pipe(gulp.dest(path));
        }
    }
    var replaceSnippet = function (path, file, includes_pattern) {
        if (file) {
            gulp.src(path + file).pipe(dom(function () {
                var self = this;
                typeArr.forEach(function (type) {
                    if (self && self.getElementsByTagName(type)) {
                        var list = self.getElementsByTagName(type);
                        for (var i = 0; i < list.length; i++) {
                            if (list[i].id) {
                                if (list[i].innerHTML && processHtml(list[i].innerHTML) || list[i].value && list[i].value.toString().trim()) {

                                    var content = list[i].innerHTML ? processHtml(list[i].innerHTML) : list[i].value ? list[i].value.toString().trim() : '';
                                    content = content.replace(/&nbsp|;|\s/g, '');
                                    var id = list[i].id.trim();
                                    if (content.replace(/\W|\d/g, '')) {

                                        if (id) {
                                            console.log("replaceSnippet:" + id);
                                            console.log("replaceSnippet: HTML:"+content);
                                            if (id.indexOf('>') != -1) {

                                                if (id.split('>').length) {
                                                    var temp = id.split('>');
                                                    var namespace = temp[0];
                                                    id = temp[1];
                                                    list[i].innerHTML= '<%=' +includes_pattern+'(' + '"' + namespace + '"' + ',' + '"' + id + '"' + ') %>';
                                                }


                                            } else {
                                                list[i].innerHTML = ' <%=' +includes_pattern+'(' + '"' + 'default' + '"' + ',' + '"' + id + '"' + ') %>';
                                            }


                                        }
                                    }

                                }
                            }
                        }
                    }
                })

                return postProcessJSP(this);
            })).pipe(gulp.dest(path));
        }
    }
    var getFiles = function (read_path, type, isScan, fullpath, callback) {
        var fileArr = [];
        fs.readdir(read_path, function (err, files) {
            if (err) {
                // console.log(read_path+": Error:"+err);
                return callback(err);
            }
            var pending = files.length;
            if (!pending)return callback(null, fileArr);
            files.forEach(function (file) {
                if (file.substr((-1) * (type.length)) === type) {
                    if (fullpath === 'Y') {
                        fileArr.push(read_path + file);
                    } else {
                        fileArr.push(file);
                    }
                    //   console.log(read_path+": get"+type +"file name is"+file);
                    if (isScan === 'Y')scan(read_path, file);
                    if (!--pending)return callback(null, fileArr);
                } else {
                    //    console.log(read_path+": No file found, go to next level");
                    getFiles(read_path + file + "/", type, isScan, fullpath, function (err, data) {
                        fileArr = fileArr.concat(data);
                        if (!--pending)return callback(null, fileArr);
                    });
                }
            });

        })
    };
    this.getFiles = getFiles;
    this.getElementBundle = scanElement;
    this.processHtml = processHtml;
    this.processJsp = postProcessJSP;
    this.replaceSnippet = replaceSnippet;
    this.skipArr=skipArr;
    this.byPassArr=byPassAssignId;
}

module.exports=keyScanner;