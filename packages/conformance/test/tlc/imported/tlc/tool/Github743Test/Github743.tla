(*---
description: Ported from TLC's Github743Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github743Test.java
features:
  - tlc-regression
outcome: safety-violation
config: |-
  SPECIFICATION
      Spec
  INVARIANT
      Inv
args:
  - -deadlock
---*)
---------------------------- MODULE Github743 ----------------------------
EXTENDS Integers

VARIABLES x, y

Init ==
	/\ x = "foo"
    /\ y = 0
	
Next ==
    \/ /\ x' = "foo"
       /\ y' = y + 1
    \/ /\ x' = TRUE
       /\ y' = y + 2
	
Spec ==
	/\ Init
	/\ [][Next]_<<x,y>>
	
Inv ==
	/\ y < 5

==========================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = "foo"
    /\ y = 0
    2217:4 2: <Next line 25, col 8 to line 26, col 20 of module Github743>
    /\ x = "foo"
    /\ y = 1
    2217:4 3: <Next line 27, col 8 to line 28, col 20 of module Github743>
    /\ x = TRUE
    /\ y = 3
    2217:4 4: <Next line 27, col 8 to line 28, col 20 of module Github743>
    /\ x = TRUE
    /\ y = 5
    2199:0 11 states generated, 9 distinct states found, 3 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
