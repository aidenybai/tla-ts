---- MODULE InitialStates ----
EXTENDS Integers

VARIABLES x, y

AssignedFirst ==
  /\ x = 0
  /\ \/ 1 = 1
     \/ 2 = 2

AssignedLast ==
  /\ \/ 1 = 1
     \/ 2 = 2
  /\ x = 1

LastBindingFirst == \A i \in {1, 2, 3} : IF i = 3 THEN y = 0 ELSE IF i = 2 THEN y > -1 ELSE TRUE

Init == LastBindingFirst /\ (AssignedFirst \/ AssignedLast)

Next == UNCHANGED <<x, y>>
====
