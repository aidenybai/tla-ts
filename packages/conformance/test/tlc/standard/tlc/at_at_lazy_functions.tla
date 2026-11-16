(*---
description: "@@ converts lazy functions."
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_lazy_functions ----
EXTENDS TLC, Naturals
Test == [i \in {1} |-> "x"] @@ [i \in {2} |-> "y"] = <<"x", "y">>
====

(*--- recorded
all:
  exit: 0
---*)
