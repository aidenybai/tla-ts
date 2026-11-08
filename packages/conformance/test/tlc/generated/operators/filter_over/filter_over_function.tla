(*---
description: filter_over applied to function, a FcnRcdValue.
ref: tlc2/value/impl/SetPredValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE filter_over_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e \in [x \in {1, 2} |-> x * 2] : TRUE})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module filter_over_function failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<2, 4>>
    is not enumerable
---*)
