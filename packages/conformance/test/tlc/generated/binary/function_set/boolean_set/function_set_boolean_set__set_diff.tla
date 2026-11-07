(*---
description: function_set of boolean_set, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_boolean_set__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(BOOLEAN) -> ({1, 2} \ {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(FALSE :> 1 @@ TRUE :> 1)}"
---*)
