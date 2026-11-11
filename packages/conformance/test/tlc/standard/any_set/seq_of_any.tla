(*---
description: A tuple of mixed values is in Seq(Any).
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE seq_of_any ----
EXTENDS TLC, Sequences
Test == <<1, "a", {}>> \in Seq(Any)
====

(*--- recorded
all:
  exit: 0
---*)
