/*
 * TODO:
 * Sort items: http://jsfiddle.net/xnnjQ/6/
 * 
 * 
 */

/*
 * Create directive to be called by list-elements to make them draggable
 */
angular.module('ftf', ['ui.directives']).directive('makeDraggable', function() {
    return function(scope, elm, attr) {
    	$(elm).draggable({
    		appendTo: 'body',
    		containment: 'window',
    		helper: 'clone',
    		revert: true,
    		stack: "li.card",
    		start: function(){
    			$(this).hide();
    		},
    		stop: function(){
    			$(this).show();
    		}
		});
    };
});

function TrelloController($scope) {
	var self = this;

	$scope.onAuthorize = function() {
	    Trello.members.get("me", function(member) {
	    	$scope.$apply(function() {
	    		$scope.user.authenticated = true;
	    		$scope.user.name = member.fullName;
	    		
	    		$scope.status.msg = "Loading cards...";
	    	});
	    
	        // Output a list of all of the cards that the member 
	        // is assigned to
	        Trello.get("members/me/cards", function(cards) {
	        	$scope.$apply(function(){
	            	$scope.cards = [];
	            	angular.forEach(cards, function(card) {
	                	$scope.cards.push(card);
	            	});
	        		$scope.status.msg = "Cards loaded.";
	            });
	        	
	        	$("li.card a").attr("target", "_blank");
	        });
	    });
	};
	
	$scope.onDeauthorize = function() {
		$scope.$apply(function() {
			$scope.user.authenticated = false;
			$scope.user.name = "-";
			$scope.cards = [];
		});
	};
	
	$scope.user = {
		name: '-',
		authenticated: false,
	};
	
	$scope.status = {
		msg: '',
	}
	
	$scope.cards = [];
	$scope.log = [];
	
	$scope.settings = {
		labels: ['green','yellow','orange','red','purple','blue'],
		selectedLabel: "red",
		urgentDate: new Date(),
		selectedBoard: "allAssigned",
		boards: [
	        { id: "allAssigned", name: "All cards assigned to me", },
	        { id: "allVisible", name: "All cards visible to me", },
		    { id: "abc", name: "ABC", },
		    { id: "def", name: "DEF", },
		    { id: "geh", name: "GEH", },
        ],
	};

	$scope.debug = function(item) {
		//$scope.log.push(item);
		console.log(item);
	}
	
	$scope.cardIsImportant = function(item) {
		return (item.labels.length > 0)
			&& item.labels.some(function(i) { return i != null && i.color != null && i.color == $scope.settings.selectedLabel });
	};
	
	$scope.cardIsUrgent = function(item) {
		if (!item.due) return false;
		var dueDate = new Date(item.due);
		//$scope.debug("Due date: " + dueDate + "; urgent date: " + $scope.settings.urgentDate + " --> " + dueDate <= $scope.settings.urgentDate);
		return dueDate <= $scope.settings.urgentDate;
	};
	
	$scope.urgentAndImportantFilter = function(item) {
		return $scope.cardIsUrgent(item) && $scope.cardIsImportant(item);
	};

	$scope.importantFilter = function(item) {
		return $scope.cardIsImportant(item) && !$scope.cardIsUrgent(item);
	};
	
	$scope.urgentFilter = function(item) {
		return $scope.cardIsUrgent(item) && !$scope.cardIsImportant(item);
	};

	$scope.notUrgentNorImportantFilter = function(item) {
		return !$scope.cardIsUrgent(item) && !$scope.cardIsImportant(item);
	};

	$scope.replaceCard = function(newCard) {
		var oldCards = $scope.cards;
		$scope.cards = [];
		$scope.cards.push(newCard);
		angular.forEach(oldCards, function(card) {
			if (newCard.id != card.id) {
				$scope.cards.push(card);
			}
		});
	};
	
	/**
	 * add new card (from frontend).
	 */
	$scope.addCard = function() {
		var newCard = {
			name: "New card...",
			done: false,
			url: "http://trello.com/abcd",
			due: new Date(),
			labels: ["red"],
		};
		
		$scope.cards.push(newCard);
	};
	
	/*
	 * Application startup code / jQuery handling of elements
	 * TODO: move somewhere else
	 */
	
	/*
	 * commented out for offline development
	 * TODO: modularize and make fault tolerant
	*/
	Trello.authorize({
	    interactive:false,
	    success: $scope.onAuthorize,
	    scope: { write: true, read: true }
	});
	
	$("#trelloAuthorize").click(function() {
	    Trello.authorize({
	        type: "popup",
	        success: $scope.onAuthorize,
	        scope: { write: true, read: true },
	        name: "First things first",
	    })
	});
	
	$("#trelloLogout").click(function() {
		Trello.deauthorize();
		$scope.onDeauthorize();
	});
	
	$("#urgent-important").droppable({
		accept: ".card",
		activeClass: "drop-active",
		hoverClass: "drop-hover",
		drop: function(event, ui) {
			var card = angular.element(ui.draggable.context).scope().card;
			if (card) {
				$scope.$apply(function() {
					if (!$scope.cardIsUrgent(card)) {
						card.due = (new Date()).toJSON();
					}
					
					if (!$scope.cardIsImportant(card)) {
						card.labels.push("red");
					}
				});
			}
		},
		tolerance: 'pointer',
	});

	$("#important").droppable({
		accept: ".card",
		activeClass: "drop-active",
		hoverClass: "drop-hover",
		drop: function(event, ui) {
			var card = angular.element(ui.draggable.context).scope().card;
			if (card) {
				if (self.cardIsUrgent(card)) {
					Trello.put(
						"cards/" + card.id + "/due",
						{ value: null, },
						function(newCard) {
							$scope.$apply(function() {
								$scope.replaceCard(newCard);
							});
						}
					);
				}
				
				if (!self.cardIsImportant(card)) {
					// TODO add label
				}
			}
		},
		tolerance: 'pointer',
	});

	$("#urgent").droppable({
		accept: ".card",
		activeClass: "drop-active",
		hoverClass: "drop-hover",
		drop: function(event, ui) {
			var card = angular.element(ui.draggable.context).scope().card;
			if (card) {
				if (!self.cardIsUrgent(card)) {
					Trello.put(
						"cards/" + card.id + "/due",
						{ value: (new Date()).toJSON(), },
						function(newCard) {
							$scope.$apply(function() {
								$scope.replaceCard(newCard);
							});
						}
					);
				}
				
				if (self.cardIsImportant(card)) {
					// TODO remove label (or ask user whether to remove the label)
				}
			}
		},
		tolerance: 'pointer',
	});
	
	$("#not-urgent-not-important").droppable({
		accept: ".card",
		activeClass: "drop-active",
		hoverClass: "drop-hover",
		drop: function(event, ui) {
			var item = angular.element(ui.draggable.context).scope().item;
			if (item) {
				$scope.$apply(function() {
					item.due = null;
					item.labels = [];
				});
				
	        	$("li.card").draggable({
	        		containment: "document",
	        		revert: true,
	        		stack: "li.card",
				});
			}
		},
		tolerance: 'pointer',
	});
}
