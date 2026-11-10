(*---
description: ToString(Any) is the string ANY.
ref: tlc2/module/AnySet.java#toString
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE to_string ----
EXTENDS TLC
Test == ToString(Any) = "ANY"
====

(*--- recorded
all:
  exit: 0
---*)
