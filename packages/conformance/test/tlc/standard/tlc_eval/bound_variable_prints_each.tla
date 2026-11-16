(*---
description: The same expression under a bound variable prints each time.
ref: tlc2/module/TLCEval.java#tlcEval
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE bound_variable_prints_each ----
EXTENDS TLC, Naturals
Test == \A i \in 1..2 : TLCEval(Print(i, i)) = i
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1  1
    | 2  2
---*)
