(*---
description: TLCEval converts a lazy function to an enumerated one.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE function_converted ----
EXTENDS TLC, Naturals
Test == PrintT(TLCEval([x \in {1, 3} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> 1 @@ 3 :> 3)"
---*)
