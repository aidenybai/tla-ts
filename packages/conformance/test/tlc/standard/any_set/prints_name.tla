(*---
description: PrintT(Any) prints ANY, the Java name, not Any.
ref: tlc2/module/AnySet.java#toString
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE prints_name ----
EXTENDS TLC
Test == PrintT(Any)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ANY"
---*)
