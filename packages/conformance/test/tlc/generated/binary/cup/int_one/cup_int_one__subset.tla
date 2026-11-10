(*---
description: cup of int_one, a IntValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_int_one__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) \cup (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_int_one__subset failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    1
    and T:
    {{}, {1}, {2}, {1, 2}}
    are not both enumerable
---*)
