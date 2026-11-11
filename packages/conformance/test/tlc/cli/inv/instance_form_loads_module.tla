(*---
description: The regex for 'INSTANCE name' lets an -inv expression use a module the spec doesn't extend.
ref: tlc2/TLC.java#handleParameters
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
args:
  - -inv
  - LET S == INSTANCE Sequences IN S!Len(<<1>>) = 2
---*)
---- MODULE instance_form_loads_module ----
VARIABLE x
Init == x = 0
Next == x' = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant __DebuggerExpr__<id> is violated by the initial state:
    x = 0
---*)
