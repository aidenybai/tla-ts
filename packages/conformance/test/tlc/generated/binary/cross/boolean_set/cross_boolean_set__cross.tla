(*---
description: cross of boolean_set, a SetEnumValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<FALSE, <<1, 3>>>>,
    |   <<FALSE, <<2, 3>>>>,
    |   <<TRUE, <<1, 3>>>>,
    |   <<TRUE, <<2, 3>>>> }
---*)
