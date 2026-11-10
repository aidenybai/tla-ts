(*---
description: Ported from TLC's ETest8.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest8.java
features:
  - tlc-suite
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
---*)
--------------- MODULE etest8  -------------

(* Test that simulation mode doesn't check for deadlock. *)

EXTENDS TLC


VARIABLE x

Init == /\ x \in {"a", "b"}
        /\ Print("This spec can deadlock, but shouldn't.", TRUE)

Next == \/ /\ x = "b"
           /\ x' = "c"
        \/ /\ x = "c"
           /\ x' = "d"
        \/ /\ x = "d"
           /\ x' = "d"
           /\ Assert(FALSE, "Test successfully completed.")

=========================================

(*--- recorded
all:
  exit: 255
  transcript: |-
    | "This spec can deadlock, but shouldn't."  TRUE
    | "This spec can deadlock, but shouldn't."  TRUE
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 2 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a tlc2.tool.EvalException
    :
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "Test successfully completed."
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 22, col 9 to line 23, col 64 of module etest8>
    x = "b"
    2217:4 2: <Next line 25, col 12 to line 26, col 22 of module etest8>
    x = "c"
    2217:4 3: <Next line 27, col 12 to line 28, col 22 of module etest8>
    x = "d"
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
---*)
