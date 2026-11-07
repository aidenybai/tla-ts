(*---
description: An operator the module doesn't define is a general error once the checks start.
ref: tlc2/tool/impl/ParameterizedSpecObj.java#getPostConditionSpecs
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -postCondition
  - cli_post_fixture!Nope
includes:
  - cli_post_fixture.tla
---*)
---- MODULE unknown_operator ----
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
    : @!@!@STARTMSG 1000:0 @!@!@
    Could not find operator: Nope in module: cli_post_fixture
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 1000:0 @!@!@
    Could not find operator: Nope in module: cli_post_fixture
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
