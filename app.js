/*!
* jquery Fancy Minesweeper
* https://github.com/fernando-paredes/jquery-fancy-minesweeper
* @license MIT licensed
*
* Copyright (C) 2017 fparedes.com - A project by Fernando Paredes
*/



//Global variables: controls

//Control: has the game started?
var gameStarted = false;

//Control: is the game over?
var gameEnded = false;

//Control: has the game been won?
var gameWon = false;

//Mines array
var minedCells = null;

//Flags count
var flags = 0;

//Time controller
var currentTime=0;

//Chronometer interval container
var chronInterval = false;




//get the settings from local storage or defaults to expert mode
var gridWidth = Lockr.get('gridWidth') || 16;
var gridHeight = Lockr.get('gridHeight') || 30;
var minesNumber = Lockr.get('minesNumber') || 99;



function loadMineSweeper (){


	//Reset everythig if we just have played...
	$('#shame, #shame-message, #victory').toggle(false);
	$('#chronometer').html(0);


	

	var cellNumber = gridWidth * gridHeight; //esto es sobre todo por comodidad



	//Get a cell id by its coordinates
	function getCellID(x, y){
		return (y-1)*gridWidth+x;
	}


	//Get the cell coordinates by its ID
	function getCellY(id){
		return (Math.floor((id-1)/gridWidth) + 1);
	}

	function getCellX(id){
		return id - ((getCellY(id)-1) * gridWidth);
	}





	//Get surrounding cells
	function getAdjacentCells(centerCellID){

		startCellX = getCellX(centerCellID);
		startCellY = getCellY(centerCellID);

		var adjacentCells = new Array();

		//Top cell
		if (startCellY > 1) {
			adjacentCells.push(getCellID(startCellX, (startCellY-1)));
		}

		//Bottom cell
		if (startCellY < gridHeight) {
			adjacentCells.push(getCellID(startCellX, (startCellY+1)));
		}

		//Left cell
		if (startCellX > 1) {
			adjacentCells.push(getCellID((startCellX-1), startCellY));
		}

		//Right cell
		if (startCellX < gridWidth) {
			adjacentCells.push(getCellID((startCellX+1), startCellY));
		}

		//Top left cell
		if (startCellY > 1 && startCellX > 1) {
			adjacentCells.push(getCellID((startCellX-1), (startCellY-1)));
		}

		//Top right cell
		if (startCellY > 1 && startCellX < gridWidth) {
			adjacentCells.push(getCellID((startCellX+1), (startCellY-1)));
		}

		//Bottom left cell
		if (startCellY < gridHeight && startCellX > 1) {
			adjacentCells.push(getCellID((startCellX-1), (startCellY+1)));
		}

		//Bottom right cell
		if (startCellY < gridHeight && startCellX < gridWidth) {
			adjacentCells.push(getCellID((startCellX+1), (startCellY+1)));
		}
		
		return adjacentCells;
	}



	//Set mined cells
	function setMines(firstCellID){

		//The number of mines should be at least 9 units minor than the total number of cells
		if (minesNumber > cellNumber - 9) {
			minesNumber = cellNumber - 9
		}

		//Get surrounding free cells
		var freeCells = getAdjacentCells(firstCellID);
		freeCells.push(parseInt(firstCellID));

		//Array of mined cells
		var minedCells = [];

		while (minedCells.length < minesNumber) {
			var random_number = Math.round(Math.random()*(cellNumber - 1) + 1);

			if (minedCells.indexOf(random_number) == -1 && $.inArray(random_number, freeCells) == -1) { 
				minedCells.push( random_number );
			}
		}



		return minedCells;

	}


	//Check if a cell has a mine
	function cellHasMine(cellID, minedCells){
		if($.inArray(parseInt(cellID), minedCells) == -1){
			return false;
		}else{
			return true;
		}
	}


	//Get surrounding mines
	function getAdjacentMines(cellID, minedCells){

		var adjacentCells = getAdjacentCells(cellID);
		var adjacentMines = new Array();

		for (var i = 0; i < adjacentCells.length; i++) {
			if (cellHasMine(adjacentCells[i], minedCells)){
				adjacentMines.push(adjacentCells[i])
			}
		}

		return adjacentMines;
	}


	//Get surrounding free cells
	function getAdjacentBlankCells(cellID, minedCells){

		var adjacentBlankCells = new Array();
		var adjacentCells = getAdjacentCells(cellID);

		for (var i = 0; i < adjacentCells.length; i++) {
			if (getAdjacentMines(adjacentCells[i], minedCells).length == 0 && !cellHasMine(adjacentCells[i], minedCells)){
				adjacentBlankCells.push(adjacentCells[i]);
			}
		}

		return adjacentBlankCells;
	}




	//Control: has the game started?
	gameStarted = false;

	//Control: is the game over?
	gameEnded = false;

	//Control: has the game been won?
	gameWon = false;

	//Mines array
	minedCells = null;

	//Flags count
	flags = 0;

	//Time controller
	time = 0;


	


	//Actual DOM stuff




	//Put the number of mines in header
	$('#mines-counter').html(minesNumber);



	//Create the board
	var boardMarkUp = '<div class="cell-row">';
	for (var i = 0; i < cellNumber; i++) {
		boardMarkUp +='<div class="cell virgin" id="' + (i+1) + '" col="' + getCellX(i+1)  + ' " row="' + getCellY(i+1) + '"></div>';

		if ((i+1)%gridWidth == 0 && i+1 < cellNumber) {
			boardMarkUp += '</div><div class="cell-row">';
		}
	}
	boardMarkUp += '</div>';



	$('#minesweeper-board').css({
		"height": gridHeight * 34,
		"width": gridWidth * 34,
	});
	$('.cell-row').css({
		"min-width": gridWidth * 34,
	});

	$('#minesweeper-board').html(boardMarkUp);





	
	//On clicking on a cell...
	$('.cell').click(function(e){

		e.preventDefault();

		if(!gameEnded && !$(this).hasClass('marked')){

			var clickedID = $(this).attr('id');

			//Unveil cell
			$(this).addClass('naked');
			$(this).removeClass('questioned');

			//Begin the game if it is not started
			if (!gameStarted) {
				gameStarted = true;
				minedCells = setMines(clickedID);
				time = Date.now();

				//Start the chronometer
				chronInterval = setInterval(() =>{
					if (!gameEnded) {
						currentTime = Math.floor((Date.now() - time) /1000)
						$('#chronometer').html(currentTime);
					}
				}, 1000);
			}

			//If the clicked cell has a mine, end the game
			if (cellHasMine(clickedID, minedCells)) {	
				gameEnded = true;

				//Unveil mistakes
				$('.marked').addClass('error');

				//Unveil mines
				for (var i = 0; i < minedCells.length; i++){
					//Only if they were not marked
					if (!$('#' + minedCells[i]).hasClass('marked')) {
						$('#' + minedCells[i]).addClass('mine');
					}else{
						$('#' + minedCells[i]).removeClass('error');
					}
				}


				//Show the losing message
				$('#shame, #shame-message').toggle(true);


				clearInterval(chronInterval);
			

				//Coyote!
				setTimeout(() => {
					$('#shame').toggle(false);
				}, 3600);

				//Explosion noise
				setTimeout(() => {
					$("#explosionAudio")[0].play();
				}, 700); 
				

			}else{

				var adjacentMines = getAdjacentMines(clickedID, minedCells);
				var adjacentCells = getAdjacentCells(clickedID);
				
				$(this).addClass('near near-' + adjacentMines.length);




				//Check surrounding cells searching for completely free ones..

		
				var adjacentBlankCells = getAdjacentBlankCells (clickedID, minedCells);

				//If the cell is completely free, open all the surrounding cells
				if (adjacentMines.length == 0) {
					for (var i = 0; i < adjacentCells.length; i++) {
						if (!$('#' + adjacentCells[i]).hasClass('naked')){
							$('#' + adjacentCells[i]).click();
						}
					}
				}else{
					//Click the surrounding completely free cells
					for (var i = 0; i < adjacentBlankCells.length; i++) {
						if (!$('#' + adjacentBlankCells[i]).hasClass('naked')){
								$('#' + adjacentBlankCells[i]).click();
						}
					}
				}
				


			}



		}
		
	});




	//On right click on a cell..
	$('.cell').contextmenu(function(e){
		e.preventDefault();

		if(!gameEnded && gameStarted){
			if (!$(this).hasClass('naked') && !$(this).hasClass('marked') && !$(this).hasClass('questioned')) {
				$(this).addClass('marked');
				navigator.vibrate(200);
			} else if (!$(this).hasClass('questioned') && $(this).hasClass('marked')) {
				$(this).removeClass('marked');
				$(this).addClass('questioned');
				navigator.vibrate(200);
			}else if ($(this).hasClass('questioned')){
				$(this).removeClass('questioned');
				navigator.vibrate(200);
			}
		}

		//Update flaga count
		flags = $('.marked').length;
		$('#mines-counter').html(minesNumber - flags);




		//Update left mines counter
		var discoveredMinesIDs = new Array();
		$('.marked').each(function() {
		    discoveredMinesIDs.push( this.id );

		});

		var discoveredMines = 0;
		for (var i = 0; i < discoveredMinesIDs.length; i++) {
			if (cellHasMine(discoveredMinesIDs[i], minedCells)){
				discoveredMines++;
			}
		}

		//If the game has been won, celebrate it!
		if (discoveredMines == minesNumber) {
			gameEnded = true;
			$("#rainbowAudio")[0].play();
			$('#victory').css('display', 'block');


			clearInterval(chronInterval);
		}

	});
}


function endGame () {
	clearInterval(chronInterval);
	gameEnded = true;
	gameStarted = false;
	time = 0;
	currentTime = 0;
}


function reloadGame (){
	endGame();
	loadMineSweeper();
}


function toggleConfig (){
	$('#config-modal, #body-overlay').toggle();
	$('#grid-width').val(gridWidth);
	$('#grid-height').val(gridHeight);
	$('#mines-number').val(minesNumber);
}





//Init game
$( document ).ready(function() {

	//Buttons
	$('[href="#reload-game"').click(e =>{
		e.preventDefault();
		reloadGame();
	});

	$('[href="#cancel-changes"], [href="#show-config"], #body-overlay').click(e =>{
		e.preventDefault();
		toggleConfig();
	});

	$('[href="#apply-changes"]').click(e =>{
		e.preventDefault();

		//Apply changes
		gridWidth =  $('#grid-width').val();
		gridHeight = $('#grid-height').val();
		minesNumber = $('#mines-number').val();

		//Save changes to local storage
		Lockr.set('gridWidth', $('#grid-width').val());
		Lockr.set('gridHeight', $('#grid-height').val());
		Lockr.set('minesNumber', $('#mines-number').val());


		toggleConfig();

		//If the game has not started, apply changes inmediately
		if (!gameStarted) {
			reloadGame();
		}
	});


	//Init game
	loadMineSweeper();
});