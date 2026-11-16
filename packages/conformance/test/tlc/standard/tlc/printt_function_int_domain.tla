(*---
description: A function on non-sequence integers prints with :> and @@.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_function_int_domain ----
EXTENDS TLC, Naturals
Test == PrintT([i \in {1, 3} |-> i * 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> 2 @@ 3 :> 6)"
---*)
