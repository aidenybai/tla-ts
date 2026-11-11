(*---
description: Any \X S tests each component.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE cross_product ----
EXTENDS TLC
Test == <<"z", 1>> \in Any \X {1}
====

(*--- recorded
all:
  exit: 0
---*)
