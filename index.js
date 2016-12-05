function dropdown(val) {
  var y = document.getElementsByClassName('btn btn-default dropdown-toggle');
  var aNode = y[0].innerHTML = val + ' <span class="caret"></span>'; // Append
}

$(function(){

    $(".dropdown-menu").on('click', 'li a', function(){
      $(".btn:first-child").text($(this).text());
      $(".btn:first-child").val($(this).text());
   });

});


var addIngredient = document.getElementById('addButton');
addIngredient.addEventListener('click', addNewIngredient);




function addNewIngredient(event) {
  var currentIngredient = document.getElementById('addIngredient');
  console.log("ooo I got clicked");
  var newIngredient = document.createElement('div');
  newIngredient.className = 'row newRowSpace';
  newIngredient.innerHTML =
    '<div class="col-lg-6">\
      <div class="input-group">\
        <span class="input-group-addon" id="basic-addon1">Ingredient</span>\
        <input type="text" class="form-control" placeholder="ex. flour" aria-describedby="basic-addon1">\
      </div>\
      <!-- /input-group -->\
    </div>\
    <div class="col-lg-6">\
      <div class="input-group">\
        <span class="input-group-addon" id="basic-addon1">Amount</span>\
        <input type="text" class="form-control" placeholder="ex. 5" aria-describedby="basic-addon1" aria-label="...">\
        <div class="input-group-btn">\
          <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Select Units <span class="caret"></span></button>\
          <ul class="dropdown-menu dropdown-menu-right">\
            <li><a>Cups</a></li>\
            <li><a>Another action</a></li>\
            <li><a>Something else here</a></li>\
            <li role="separator" class="divider"></li>\
            <li><a>Separated link</a></li>\
          </ul>\
        </div>\
        <!-- /btn-group -->\
      </div>\
      <!-- /input-group -->\
    </div>';

    currentIngredient.appendChild(newIngredient);
}

console.log("I work!");
