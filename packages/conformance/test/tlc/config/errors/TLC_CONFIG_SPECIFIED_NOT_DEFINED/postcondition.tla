(*---
description: A POSTCONDITION name that is undefined is only looked up after the initial states, where TLC reports the error as an unexpected exception with exit 255 rather than a config error with exit 151.
ref: tlc2/tool/impl/Spec.java#getPostConditionSpecs
features:
  - tlc-bug
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Nope
correct:
  all:
    exit: 151
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2229:1 The post condition Nope specified in the configuration file
      is not defined in the specification.
---*)
---- MODULE postcondition ----
EXTENDS Naturals
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
    2229:0 The post condition Nope specified in the configuration file
    is not defined in the specification.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
