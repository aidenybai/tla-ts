(*---
description: Evaluates a random record expression, seed 262, number 4306.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04306 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((\E b6787 \in {x \in 1..3 : x > 1} : TRUE) /\ (FALSE \/ FALSE)) -> Cardinality((7 .. 2)) [] OTHER -> ((1 \div 3) \div (<<5, 6>> @@ [x \in Nat |-> x + 1])), b |-> ((SubSeq([x \in 1..2 |-> x], 3, 2147483647) = ((1 :> 2) @@ [x \in 1..2 |-> x])) /\ ((-1 * FALSE) :> (0 * 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04306 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
