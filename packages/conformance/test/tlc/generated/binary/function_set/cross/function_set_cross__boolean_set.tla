(*---
description: function_set of cross, a SetOfTuplesValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_cross__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({1, 2} \X {3}) -> (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (<<1, 3>> :> FALSE @@ <<2, 3>> :> FALSE),
    |   (<<1, 3>> :> FALSE @@ <<2, 3>> :> TRUE),
    |   (<<1, 3>> :> TRUE @@ <<2, 3>> :> FALSE),
    |   (<<1, 3>> :> TRUE @@ <<2, 3>> :> TRUE) }
---*)
