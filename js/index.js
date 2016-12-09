// Event handlers, I'm going to try out that event delegation thing.
function editify(recipeElement) {
	recipeElement.classList.add('edit-mode');
	let editButton = recipeElement.querySelector('.edit');
	editButton.classList.add('done');
	editButton.classList.remove('edit');
	editButton.innerHTML = 'Done';
	recipeElement.querySelector('header > h2').contentEditable = "true";
	recipeElement.querySelector('.details').contentEditable = "true";
	recipeElement.querySelectorAll('.ingredients li').forEach(ingredient => {
		ingredient.querySelector('span').contentEditable = "true";
		ingredient.querySelectorAll('input, select').forEach(inSel => {
			inSel.removeAttribute('disabled');
		});
	});
}
function uneditify(recipeElement) { // This isn't really an event handler
	recipeElement.classList.remove('edit-mode');
	let editButton = recipeElement.querySelector('.done');
	editButton.classList.remove('done');
	editButton.classList.add('edit');
	editButton.innerHTML = 'Edit';
	recipeElement.querySelector('header > h2').removeAttribute('contentEditable');
	recipeElement.querySelector('.details').removeAttribute('contentEditable');
	recipeElement.querySelectorAll('.ingredients li').forEach(ingredient => {
		ingredient.querySelector('span').removeAttribute('contentEditable');
		ingredient.querySelectorAll('input, select').forEach(inSel => {
			inSel.disabled = true;
		});
	});
}
function deleteRecipe(recipeElement) {
	if(!recipeElement.id){
		return;
	}
	// This is the database stuff:
	let xhr = new XMLHttpRequest();
	xhr.open('delete', '/api/recipes/');
	xhr.onload = (response) => {
		recipeElement.remove();
	};
	xhr.send(JSON.stringify({'id': recipeElement.id}));
}
function updateProportions(recipeElement) {
	// Not implemented yet.
}
function updateRecipe(recipeElement) { // Used when clicking Done
	uneditify(recipeElement);
	let servingsElement = recipeElement.querySelector('.servings');
	let titleElement = recipeElement.querySelector('.title');
	let descriptionElement = recipeElement.querySelector('.details');
	let ingredientElements = recipeElement.querySelectorAll('.ingredients li')
	let data = {
		'_id': recipeElement.id || "create",
		'title': titleElement.innerText || "Recipe Name",
		// 'last-coefficient': 0.5, // I've decided not to implement this.
		'servings': servingsElement.value || 1,
		'description': descriptionElement.innerHTML || "This is where the description would go",
		'ingredients': Array.prototype.map.call(ingredientElements, ingredientElement => {
			return {
				'name': ingredientElement.querySelector('span').innerText || "Ingredient name",
				'quantity': ingredientElement.querySelector('.quantity').value || 1,
				'units': ingredientElement.querySelector('.units').value || "Unitless"
			};
		})
	};
	// This is the database stuff:
	let xhr = new XMLHttpRequest();
	if (recipeElement.id) {
		xhr.open('put', '/api/recipes');
	} else {
		xhr.open('post', '/api/recipes/');
	}
	xhr.onload = (response) => {
		let xhr = response.target;
		recipeElement.id = JSON.parse(xhr.responseText)._id;
	};
	xhr.send(JSON.stringify(data));
}
function addIngredient(recipeElement) {
	let newIngredient = document.createElement('li');
	newIngredient.innerHTML =
`
<span contentEditable="true">Ingredient Name</span>
<input class="quantity" type="number" step="0.01"/>
<select class="units">
	 <option disabled>Volume</option>
   <option>Cups</option>
   <option>Tablespoon</option>
   <option>Teaspoon</option>
	   <option disabled>Weight</option>
   <option>Pound</option>
 <option disabled>Fluid</option>
   <option>Ounce</option>
   <option>Pint</option>
   <option>Quart</option>
   <option>Gallon</option>
 <option disabled>Misc.</option>
   <option>Unitless</option>
</select>
   `;
	recipeElement.querySelector('.ingredients').appendChild(newIngredient);
}

// Function to create a recipe
function createRecipe(mainEl) {
	let newRecipe = document.createElement('section');
	newRecipe.className = "recipe";
	newRecipe.innerHTML =
`<header>
	<h2 class="title">Recipe Name</h2>
<nav>
<button class="add-ingredient">Add Ingredient</button>
<button class="edit">Edit</button>
<button class="delete">Delete</button>
<label>Servings:<input class="servings" type="number" name="servings"></label>
</nav>
</header>
<ul class="ingredients">
	<li>
<span>Ingredient Name</span>
<input class="quantity" type="number" disabled="true" step="0.01"/>
<select class="units" disabled="true">
	  <option disabled>Volume</option>
	<option>Cups</option>
	<option>Tablespoon</option>
	<option>Teaspoon</option>
		<option disabled>Weight</option>
	<option>Pound</option>
  <option disabled>Fluid</option>
	<option>Ounce</option>
	<option>Pint</option>
	<option>Quart</option>
	<option>Gallon</option>
  <option disabled>Misc.</option>
	<option>Unitless</option>
		</select>
</li>
</ul>
<p class="details">This is the recipe's instructions.  They are probably pretty long and have lots of intricate details.  Yea, more power to you instructions.</p>`;
	if(mainEl.children.length == 0) {
		mainEl.appendChild(newRecipe);
	} else {
		mainEl.insertBefore(newRecipe, mainEl.children[0]);
	}
	editify(newRecipe);
}

// Initialize
(function initialize() {
	// Get the main element
	let mainEl = document.querySelector('main');

	// Listen to the add-recipe link
	let addRecipeElement = document.getElementById('add-recipe');
	addRecipeElement.addEventListener('click', (e) => {
		createRecipe(mainEl);
	});

	// Listen to all of the other buttons
	mainEl.addEventListener('click', (e) => {
		let recipeElement;
		let search = e.target.parentElement;
		// Find the recipe element that contains the
		while(true) {
			if (search == document || search == mainEl) {
				// Caught an event we don't want
				return;
			} else if (search.classList.contains('recipe')) {
				recipeElement = search;
				break;
			}
			search = search.parentElement;
		}
		if (e.target.classList.contains('edit')) {
			editify(recipeElement);
		} else if (e.target.classList.contains('delete')) {
			deleteRecipe(recipeElement);
		} else if (e.target.classList.contains('add-ingredient')) {
			addIngredient(recipeElement);
		} else if (e.target.classList.contains('done')) {
			updateRecipe(recipeElement);
		} else {
			// Once again, an event we don't want
			return;
		}
	});
})();
