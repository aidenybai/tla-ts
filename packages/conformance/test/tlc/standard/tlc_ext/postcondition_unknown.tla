(*---
description: An undefined POSTCONDITION name is refused after the state space is explored, as an unexpected exception and not a configuration error.
ref: tlc2/tool/AbstractChecker.java#checkPostCondition
features:
  - TLCExt
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Missing
---*)
---- MODULE postcondition_unknown ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3

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
    2229:0 The post condition Missing specified in the configuration file
    is not defined in the specification.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
