---- MODULE Torus ----
EXTENDS Naturals
VARIABLES position, heading, marks

Init == position = [row |-> 0, col |-> 0] /\ heading = "east" /\ marks = {}

East ==
  /\ position' = [position EXCEPT !.col = (@ + 1) % 200]
  /\ heading' = "east"
  /\ marks' = {position.row % 2}

North ==
  /\ position' = [position EXCEPT !.row = (@ + 1) % 75]
  /\ heading' = "north"
  /\ marks' = marks

Next == East \/ North
====
