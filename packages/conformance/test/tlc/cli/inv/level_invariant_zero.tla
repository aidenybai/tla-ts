(*---
description: -invlevel 0 is TLCGet("level") < 0, which even the initial state fails.
ref: tlc2/TLC.java#handleParameters
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
args:
  - -invlevel
  - "0"
---*)
---- MODULE level_invariant_zero ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant __DebuggerExpr__<id> is violated by the initial state:
    x = 0
---*)
