(*---
description: A function with domain Any applies to anything, the use TLC.tla names as Any's origin.
ref: tlc2/module/TLC.java#Any
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE any_function_domain ----
EXTENDS TLC, Naturals
Test == [x \in Any |-> 1]["a"] = 1 /\ [x \in Any |-> 1][2] = 1
====

(*--- recorded
all:
  exit: 0
---*)
