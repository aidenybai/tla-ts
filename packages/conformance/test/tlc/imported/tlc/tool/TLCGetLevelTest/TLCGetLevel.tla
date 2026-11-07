(*---
description: Ported from TLC's TLCGetLevelTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/TLCGetLevelTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  INIT
  Init
  NEXT
  Next
  PROPERTY
  Prop
  INVARIANT
  Inv
  CONSTRAINT
  StateConstraint
  ACTION_CONSTRAINT
  ActionConstraint
  POSTCONDITION 
  PostCondition
  PROPERTY Tautology
args:
  - -deadlock
---*)
--------------------------- MODULE TLCGetLevel ----------------------------
EXTENDS Integers, TLC

VARIABLES x, y, yb, z

ASSUME(TLCGet("level") = 0)

Init ==
   /\ TLCGet("level") = 0
   /\ yb = TLCGet("level")
   /\ x = 0
   /\ y = TLCGet("level")
   /\ z = 1

Next == 
   /\ TLCGet("level") > 0
   /\ Assert(TLCGet("level") + 1 = TLCGet("level")', "Failure pre next-state")
   /\ yb' = TLCGet("level")
   /\ x < 3 
   /\ x' = x + 1
   /\ y' = TLCGet("level")
   /\ z' = TLCGet("level")'
   /\ Assert(TLCGet("level") + 1 = TLCGet("level")', "Failure post next-state")

Inv ==
    /\ y = yb
    /\ z = TLCGet("level")
    /\ x + 1 = TLCGet("level")
    \* /\ TLCGet("level") < 4  \* To trigger a safety violation.

ActionConstraint ==
    /\ Assert(TLCGet("level") + 1 = TLCGet("level")', "Failure action constraint")

StateConstraint ==
    /\ TLCGet("level") \in 1..4

Prop ==
    /\ <>[](x = 2)
    /\ [][y' > y /\ yb' > yb /\ TLCGet("level") + 1 = TLCGet("level")']_<<x, y, yb, z>>

PostCondition ==
    TLCGet("spec") = [ impliedinits |-> {},
                impliedactions |-> 
                    { [ coverage |-> [count |-> 3], name |-> "Prop",
                        location |-> 
                            [ beginLine |-> 39,
                                beginColumn |-> 10,
                                endLine |-> 39,
                                endColumn |-> 87,
                                module |-> "TLCGetLevel" ] ] },
                invariants |->
                    { [ coverage |-> [count |-> 4],
                        name |-> "Inv",
                        location |->
                            [ beginLine |-> 26,
                                beginColumn |-> 5,
                                endLine |-> 28,
                                endColumn |-> 30,
                                module |-> "TLCGetLevel" ] ] },
                impliedtemporals |->
                    { [ name |-> "Prop",
                        location |->
                            [ beginLine |-> 38,
                                beginColumn |-> 8,
                                endLine |-> 38,
                                endColumn |-> 18,
                                module |-> "TLCGetLevel" ] ] ,
				      [ name |-> "Tautology",
				        location |->
				            [ beginLine |-> 144,
				                beginColumn |-> 14,
				                endLine |-> 144,
				                endColumn |-> 31,
				                module |-> "TLCGetLevel" ] ] },
                temporals |-> {},
                actions |->
                    { [ coverage |-> [generated |-> 6, distinct |-> 3],
                        name |-> "Next",
                        location |->
                            [ beginLine |-> 16,
                                beginColumn |-> 4,
                                endLine |-> 23,
                                endColumn |-> 79,
                                module |-> "TLCGetLevel" ] ] },
                inits |->
                    { [ coverage |-> [generated |-> 2, distinct |-> 2],
                        name |-> "Init",
                        location |->
                            [ beginLine |-> 9,
                                beginColumn |-> 4,
                                endLine |-> 13,
                                endColumn |-> 11,
                                module |-> "TLCGetLevel" ] ] },
                variables |->
                    { [ coverage |-> [distinct |-> 3],
                        name |-> "x",
                        location |->
                            [ beginLine |-> 4,
                                beginColumn |-> 11,
                                endLine |-> 4,
                                endColumn |-> 11,
                                module |-> "TLCGetLevel" ] ],
                        [ coverage |-> [distinct |-> 3],
                        name |-> "y",
                        location |->
                            [ beginLine |-> 4,
                                beginColumn |-> 14,
                                endLine |-> 4,
                                endColumn |-> 14,
                                module |-> "TLCGetLevel" ] ],
                        [ coverage |-> [distinct |-> 3],
                        name |-> "yb",
                        location |->
                            [ beginLine |-> 4,
                                beginColumn |-> 17,
                                endLine |-> 4,
                                endColumn |-> 18,
                                module |-> "TLCGetLevel" ] ],
                        [ coverage |-> [distinct |-> 3],
                        name |-> "z",
                        location |->
                            [ beginLine |-> 4,
                                beginColumn |-> 21,
                                endLine |-> 4,
                                endColumn |-> 21,
                                module |-> "TLCGetLevel" ] ] },
                actionconstraints |->
                    { [ name |-> "ActionConstraint",
                        location |->
                            [ beginLine |-> 32,
                                beginColumn |-> 5,
                                endLine |-> 32,
                                endColumn |-> 82,
                                module |-> "TLCGetLevel" ] ] },
                constraints |->
                    { [ name |-> "StateConstraint",
                        location |->
                            [ beginLine |-> 35,
                                beginColumn |-> 5,
                                endLine |-> 35,
                                endColumn |-> 31,
                                module |-> "TLCGetLevel" ] ] } ]

Tautology == (x = x) ~> (x = x)
=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 8 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ yb = 0
    /\ x = 0
    /\ y = 0
    /\ z = 1
    2217:4 2: <Next line 41, col 4 to line 48, col 79 of module TLCGetLevel>
    /\ yb = 1
    /\ x = 1
    /\ y = 1
    /\ z = 2
    2217:4 3: <Next line 41, col 4 to line 48, col 79 of module TLCGetLevel>
    /\ yb = 2
    /\ x = 2
    /\ y = 2
    /\ z = 3
    2217:4 4: <Next line 41, col 4 to line 48, col 79 of module TLCGetLevel>
    /\ yb = 3
    /\ x = 3
    /\ y = 3
    /\ z = 4
    2218:4 5: Stuttering
    2257:3 The stuttering counterexample above may be caused by the absence of a behavior specification (SPECIFICATION). Only INIT and NEXT have been provided, so TLC permits infinite stuttering. To rule out such counterexamples, use SPECIFICATION Spec, with Spec asserting a suitable fairness constraint (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
    2404:1 Postcondition PostCondition at line 67, col 5 to line 167, col 64 of module TLCGetLevel is false.
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
