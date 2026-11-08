(*---
description: Evaluates a random int expression, seed 262, number 7658.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07658 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (Append(<<1, 1>>, (2147483647 % 7)) = ((CHOOSE f \in [1..2 -> {1, 2}] : TRUE) @@ [b11785 \in Nat |-> b11785])) THEN IF (\E b11786 \in (3 .. 1) : [a |-> b11786, b |-> FALSE]) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a ELSE Cardinality({b11787 : b11787 \in {}}) ELSE Len(SubSeq(Tail(<<3, 1, 2>>), [b11788 \in Nat |-> 3], ([x \in 1..2 |-> x] * 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07658 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
