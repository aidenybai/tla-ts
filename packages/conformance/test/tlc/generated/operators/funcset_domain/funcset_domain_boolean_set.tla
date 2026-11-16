(*---
description: funcset_domain applied to boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([BOOLEAN -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(FALSE :> 9 @@ TRUE :> 9)}"
---*)
