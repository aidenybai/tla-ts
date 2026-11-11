(*---
description: diff of set_of_records, a SetOfRcdsValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_of_records__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \ ({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_set_of_records__set_ints failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare record:
    [a |-> 1]
    with non-record
    2
---*)
