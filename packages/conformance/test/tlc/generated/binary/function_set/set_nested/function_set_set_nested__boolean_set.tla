(*---
description: function_set of set_nested, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_nested__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({{1}, {}}) -> (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { ({} :> FALSE @@ {1} :> FALSE),
    |   ({} :> FALSE @@ {1} :> TRUE),
    |   ({} :> TRUE @@ {1} :> FALSE),
    |   ({} :> TRUE @@ {1} :> TRUE) }
---*)
