(*---
description: TLCGet("spec") describes inits, actions, variables, invariants, constraints and properties.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  PROPERTY Prop
  CONSTRAINT Con
  ACTION_CONSTRAINT Act
  POSTCONDITION Post
---*)
---- MODULE spec_postcondition ----
EXTENDS TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Con == x < 5
Act == x' # 7
Inv == x < 3
Prop == [](x < 3)
Post == PrintT(TLCGet("spec"))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [ impliedinits |-> {},
    |   impliedactions |-> {},
    |   invariants |->
    |       { [ name |-> "Inv",
    |           location |->
    |               [ beginLine |-> 23,
    |                 beginColumn |-> 8,
    |                 endLine |-> 23,
    |                 endColumn |-> 12,
    |                 module |-> "spec_postcondition" ] ],
    |         [ name |-> "Prop",
    |           location |->
    |               [ beginLine |-> 24,
    |                 beginColumn |-> 12,
    |                 endLine |-> 24,
    |                 endColumn |-> 16,
    |                 module |-> "spec_postcondition" ] ] },
    |   impliedtemporals |-> {},
    |   temporals |-> {},
    |   actions |->
    |       { [ name |-> "Next",
    |           location |->
    |               [ beginLine |-> 20,
    |                 beginColumn |-> 9,
    |                 endLine |-> 20,
    |                 endColumn |-> 24,
    |                 module |-> "spec_postcondition" ] ] },
    |   inits |->
    |       { [ name |-> "Init",
    |           location |->
    |               [ beginLine |-> 19,
    |                 beginColumn |-> 9,
    |                 endLine |-> 19,
    |                 endColumn |-> 13,
    |                 module |-> "spec_postcondition" ] ] },
    |   variables |->
    |       { [ name |-> "x",
    |           location |->
    |               [ beginLine |-> 18,
    |                 beginColumn |-> 10,
    |                 endLine |-> 18,
    |                 endColumn |-> 10,
    |                 module |-> "spec_postcondition" ] ] },
    |   actionconstraints |->
    |       { [ name |-> "Act",
    |           location |->
    |               [ beginLine |-> 22,
    |                 beginColumn |-> 1,
    |                 endLine |-> 22,
    |                 endColumn |-> 13,
    |                 module |-> "spec_postcondition" ] ] },
    |   constraints |->
    |       { [ name |-> "Con",
    |           location |->
    |               [ beginLine |-> 21,
    |                 beginColumn |-> 1,
    |                 endLine |-> 21,
    |                 endColumn |-> 12,
    |                 module |-> "spec_postcondition" ] ] } ]
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
