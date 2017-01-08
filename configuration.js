const settings = require('electron-settings');

settings.defaults({
    'config' :{
        pivot: 3.0,
        max_temp: 10.0,
        min_temp: -25.0,
        display_temp: true,
        display_humidity: true
    }
})

if(!settings.hasSync('config')) {
    settings.resetToDefaultsSync();
}
var config = settings.getSync('config');

console.log("config");
console.log(config);

var save = function(c){
    console.log("saving config: ");
    console.log(c);
    settings.setSync('config', c);
}
module.exports = {
    config: config,
    save: save
};
