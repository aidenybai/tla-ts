(*---
description: Evaluates a random bool expression, seed 262, number 8697.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08697 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<5, 6>> EXCEPT ![2] = 3] @@ (CHOOSE f \in [{1, 2} -> 1..2] : TRUE)))[((3 % [a |-> 1]) * (-2))] \in (SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0) \ ({2, 3} \cup UNION {2..1, {1, 2}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08697 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
