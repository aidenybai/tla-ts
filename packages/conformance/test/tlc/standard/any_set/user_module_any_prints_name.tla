(*---
description: The overridden ANY prints as ANY, not as its TLA+ definition.
ref: tlc2/module/AnySet.java#toString
features:
  - AnySet
flags:
  - expression
outcome: success
includes:
  - AnySet.tla
---*)
---- MODULE user_module_any_prints_name ----
EXTENDS AnySet, TLC
Test == PrintT(ANY)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ANY"
---*)
