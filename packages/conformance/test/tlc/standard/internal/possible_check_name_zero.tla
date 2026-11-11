(*---
description: _CheckName prints the counts and fails for a name only tracked with FALSE.
ref: tla2sany/StandardModules/_Possible.tla
features:
  - _Possible
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
---*)
---- MODULE possible_check_name_zero ----
EXTENDS _Possible, TLC, Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == _Track(x > 9, "never")
Post == _CheckName("never")
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [never |-> 0]
    2404:1 Postcondition Post at line 19, col 9 to line 19, col 27 of module possible_check_name_zero is false.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
