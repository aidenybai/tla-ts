(*---
description: A constant expression is cached on its node, so a repeated evaluation prints once.
ref: tlc2/module/TLCEval.java#tlcEvalConst
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE constant_cached_prints_once ----
EXTENDS TLC, Naturals
Test == \A i \in 1..3 : TLCEval(Print("once", 7)) = 7
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "once"  7
    | "once"  7
    | "once"  7
---*)
