$(document).ready(function(){

    $("someId").on("click", function(){
        
        $.post("/chats", function(data){

            $("#myModalDiv").html(data).fadeIn();
        
        });

    });

});