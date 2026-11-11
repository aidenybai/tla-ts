(*---
description: A numeral as the whole Next makes getActions fail while TLC starts up, before it checks anything.
ref: tlc2/tool/impl/Tool.java#getActions
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE numeral_next ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == 1
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : The next state relation is not a boolean expression.
    1
---*)
