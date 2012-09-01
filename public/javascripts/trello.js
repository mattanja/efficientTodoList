/*
 * TODO:
 * Sort items: http://jsfiddle.net/xnnjQ/6/
 * 
 * 
 */

function TrelloController($scope) {
	var self = this;
	this.cardIsImportant = function(item) {
		return (item.labels.length > 0);
	};
	
	this.cardIsUrgent = function(item) {
		return (item.due != null);
	};

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
	        		$.each(cards, function(ix, card) {
	                	$scope.cards.push(card);
	            	});
	        		$scope.status.msg = "Cards loaded.";
	            });
	        	
	        	$("li.card").draggable({
	        		containment: "document",
	        		revert: true,
	        		stack: "li.card",
				});
	        });
	    });
	};
	
	$scope.onDeauthorize = function() {
		$scope.$apply(function() {
			$scope.user.authenticated = false;
			$scope.user.name = "-";
			$scope.cards = [];
		});
	}
	
	$scope.user = {
		name: '-',
		authenticated: false,
	};
	
	$scope.status = {
		msg: '',
	}
	
	$scope.cards = [];

	$scope.urgentAndImportantFilter = function(item) {
		return self.cardIsUrgent(item) && self.cardIsImportant(item);
	}

	$scope.importantFilter = function(item) {
		return self.cardIsImportant(item) && !self.cardIsUrgent(item);
	}
	
	$scope.urgentFilter = function(item) {
		return self.cardIsUrgent(item) && !self.cardIsImportant(item);
	}

	$scope.notUrgentNorImportantFilter = function(item) {
		return !self.cardIsUrgent(item) && !self.cardIsImportant(item);
	}

	/*
	 * Application startup...
	 * TODO: move somewhere else
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
	        scope: { write: true, read: true }
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
			var item = angular.element(ui.draggable.context).scope().item;
			if (item) {
				$scope.$apply(function() {
					if (!self.cardIsUrgent(item)) {
						item.due = new Date();
					}
					
					if (!self.cardIsImportant(item)) {
						item.labels.push("red");
					}
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

	$("#important").droppable({
		accept: ".card",
		activeClass: "drop-active",
		hoverClass: "drop-hover",
		drop: function(event, ui) {
			var item = angular.element(ui.draggable.context).scope().item;
			if (item) {
				$scope.$apply(function() {
					if (self.cardIsUrgent(item)) {
						item.due = null
					}
					
					if (!self.cardIsImportant(item)) {
						item.labels.push("red");
					}
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

	$("#urgent").droppable({
		accept: ".card",
		activeClass: "drop-active",
		hoverClass: "drop-hover",
		drop: function(event, ui) {
			var card = angular.element(ui.draggable.context).scope().card;
			if (card) {
				// "2012-09-02T10:00:00.000Z"
				//var newdate = $.datepicker.formatDate('yyyy-mm-ddTHH:')
				
				Trello.put(
					"cards/" + card.id + "/due",
					{ value: (new Date()).toJSON(), },
					function(newCard) {
						$scope.$apply(function() {
							var oldCards = $scope.cards;
							$scope.cards = [];
							$scope.cards.push(newCard);
							angular.forEach(oldCards, function(c) {
								if (c.id != card.id) {
									$scope.cards.push(c);
								}
							})
						});
					}
				);
				
				/*
				$scope.$apply(function() {
					if (!self.cardIsUrgent(card)) {
						card.due = new Date();
					}
					
					if (self.cardIsImportant(item)) {
						item.labels = [];
					}
				});
				
	        	$("li.card").draggable({
	        		containment: "document",
	        		revert: true,
	        		stack: "li.card",
				});
				*/
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
