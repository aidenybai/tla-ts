(*---
description: An alias error on an initial violation adds the error field.
ref: tlc2/tool/impl/Tool.java#evalAlias
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE initial_violation_eval_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x = 1
A == [p |-> 1 \div x]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    /\ x = 0
    /\ _ALIASEvalError = "@!@!@STARTMSG 2179:0 @!@!@\nThe second argument of \\div is 0.\n@!@!@ENDMSG 2179 @!@!@"
---*)
