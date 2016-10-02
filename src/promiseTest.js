function foo(){
    return Promise.resolve('foo');
}

function bar(){
    return Promise.reject(new Error('bar'));
}

function baz(){
    return Promise.resolve('baz');
}

return Promise.all([foo(), bar(), baz()])
    .then(function(results){
        console.log(results);
    })
    .catch(function(err){
        console.log(err);
    });