(*---
description: A function with domain Any applies to any argument lazily.
ref: tlc2/module/TLC.java#Any
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE function_over_any_applies ----
EXTENDS TLC
Test == [x \in Any |-> x][3] = 3 /\ [x \in Any |-> 1]["a"] = 1
====

(*--- recorded
all:
  exit: 0
---*)
