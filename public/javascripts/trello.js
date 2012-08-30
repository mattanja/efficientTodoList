/*
 * TODO:
 * Sort items: http://jsfiddle.net/xnnjQ/6/
 * 
 * 
 */

function TrelloController($scope) {
	var self = this;
	this.itemIsImportant = function(item) {
		return (item.labels.length > 0);
	};
	
	this.itemIsUrgent = function(item) {
		return (item.due != null);
	};

	$scope.onAuthorize = function() {
		$("#trelloAuthorize").empty();

	    Trello.members.get("me", function(member) {
	    	$scope.$apply(function() {
	    		$scope.user.name = member.fullName;
	    		
	    		$scope.status.msg = "Loading cards...";
	    	});
	    
	        // Output a list of all of the cards that the member 
	        // is assigned to
	        Trello.get("members/me/cards", function(cards) {
	        	$scope.$apply(function(){
	            	$scope.items = [];
	        		$.each(cards, function(ix, card) {
	                	$scope.items.push(card);
	            	});
	        		$scope.status.msg = "Cards loaded.";
	            });
	        	
	        	$("li.cardItem").draggable({
	        		containment: "document",
	        		revert: true,
	        		stack: "li.cardItem",
				});
	        });
	    });
	};
	
	Trello.authorize({
	    interactive:false,
	    success: $scope.onAuthorize
	});
	
	$("#trelloAuthorize").click(function() {
	    Trello.authorize({
	        type: "popup",
	        success: $scope.onAuthorize
	    })
	});
	
	$("div.quadrant").droppable({
		accept: ".cardItem",
		activeClass: "drop-active",
		hoverClass: "drop-hover",
		drop: function(event, ui) {
			
		},
		tolerance: 'pointer',
	});
	
	$scope.user = {
		name: '-',
	};
	
	$scope.status = {
		msg: '',
	}
	
	$scope.items = [];

	$scope.urgentAndImportantFilter = function(item) {
		return self.itemIsUrgent(item) && self.itemIsImportant(item);
	}

	$scope.importantFilter = function(item) {
		return self.itemIsImportant(item) && !self.itemIsUrgent(item);
	}
	
	$scope.urgentFilter = function(item) {
		return self.itemIsUrgent(item) && !self.itemIsImportant(item);
	}

	$scope.notUrgentNorImportantFilter = function(item) {
		return !self.itemIsUrgent(item) && !self.itemIsImportant(item);
	}
}
