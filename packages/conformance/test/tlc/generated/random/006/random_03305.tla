(*---
description: Evaluates a random set expression, seed 262, number 3305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b5256 \in ([<<>> EXCEPT ![1] = 3] \ UNION {SUBSET {1}, {x \in 1..3 : x > 1}}) : (~(<<1, 2>> = (1 :> 2)))} \cup {Head(<<1, 2>>), Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 30 to line 14, col 33 of module random_03305
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03305 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 2 with non-integer:
    {}
---*)
