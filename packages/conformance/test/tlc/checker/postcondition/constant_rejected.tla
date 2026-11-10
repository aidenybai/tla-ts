(*---
description: "A POSTCONDITION whose definition is constant is folded to a value and rejected as a constant. Model checking reports it as an unexpected exception (exit 255) and simulation as a config error (exit 151). This is a TLC bug: Tool.java calls getPostConditionSpecs outside its try, and the comment there says postconditions are constant-level."
features: [tlc-bug]
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
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
---- MODULE constant_rejected ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
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
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
