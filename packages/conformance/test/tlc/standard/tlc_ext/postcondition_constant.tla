(*---
description: A constant-level POSTCONDITION is refused after the state space is explored, so the error surfaces as an unexpected exception.
ref: tlc2/tool/AbstractChecker.java#checkPostCondition
features:
  - TLCExt
  - tlc-bug
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
correct:
  all:
    exit: 151
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2233:1 The post condition Post cannot be a constant.
---*)
---- MODULE postcondition_constant ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == TRUE
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2233:0 The post condition Post cannot be a constant.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
