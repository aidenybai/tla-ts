(*---
description: function_set of boolean_set, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_boolean_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(BOOLEAN) -> (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (FALSE :> FALSE @@ TRUE :> FALSE),
    |   (FALSE :> FALSE @@ TRUE :> TRUE),
    |   (FALSE :> TRUE @@ TRUE :> FALSE),
    |   (FALSE :> TRUE @@ TRUE :> TRUE) }
---*)
