$(function(){

    $(".dropdown-menu").on('click', 'li a', function(){
      $(".btn-units:first-child").text($(this).text());
      $(".btn-units:first-child").val($(this).text());
   });

});

window.onload = function(){
	var location = window.location.pathname.split('/');
	if(location[location.length-2] == "add"){
		var addIngredient = document.getElementById('addButton');
		addIngredient.addEventListener('click', addNewIngredient);
	} else if (location.length==2){
		addRecipeSummary();
	}
}



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
          <button type="button" class="btn-units btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Select Units <span class="caret"></span></button>\
          <ul class="dropdown-menu dropdown-menu-right">\
          <li><a>Teaspoon</a></li> \
          <li><a>Tablespoon</a></li> \
          <li><a>Cups</a></li> \
          <li><a>Quart</a></li> \
          </ul>\
        </div>\
        <!-- /btn-group -->\
      </div>\
      <!-- /input-group -->\
    </div>';

    currentIngredient.appendChild(newIngredient);
}

function addRecipeSummary(){
	
	var size = 0; //will be # of entries in collection
	var ingsize  = 0 //will be # of ingredients in recipe
	var secret = document.getElementById('secretdiv');
	var newRecipe = document.createElement('div');
	var newHeader = document.createElement('h1');
	var newIng = document.createElement('p');
	var recipeName = 'mongo info here';
	var ingName = 'alsomongo';
	for(var a = 0; a<size; a++){
		newRecipe = document.createElement('div');
		newHeader = document.createElement('h1');
		recipeName = 'mongo info again';
		newHeader.innerHTML = recipeName
		newRecipe.appendChild(newHeader);
		ingSize = 0 
		for(var b = 0; b<ingSize; b++){
			newIng = document.createElement('p');
			ingName = 'mongo info again';
			newIng.innerHTML = ingName;
			newRecipe.appendChild(newIng);
		}
		secret.appendChild(newRecipe);
	}
}
console.log("I work!");
