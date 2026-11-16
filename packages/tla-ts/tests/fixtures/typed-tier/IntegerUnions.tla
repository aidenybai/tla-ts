---- MODULE IntegerUnions ----
EXTENDS Integers
CONSTANT NULL
VARIABLES slot, count
Small == UNION {[0..1 -> 0..1 \union {NULL}], [0..1 -> {2}]}
Init == slot = [index \in 0..1 |-> NULL] /\ count = 0
Spill ==
  /\ slot[0] \in Nat
  /\ slot' = [slot EXCEPT ![1] = 0]
  /\ count' = count + 1
Reset ==
  /\ slot \in Small
  /\ slot[1] \in Int \union {NULL}
  /\ count > 0
  /\ slot' = [slot EXCEPT ![0] = NULL]
  /\ count' = count - 1
Write(index) ==
  /\ slot[index] \notin Int
  /\ slot' = [slot EXCEPT ![index] = count - 1]
  /\ UNCHANGED count
Grow == count < 3 /\ count' = count + 1 /\ UNCHANGED slot
Next == Spill \/ Reset \/ Grow \/ \E index \in 0..1 : Write(index)
Bounded == count < 4
====
