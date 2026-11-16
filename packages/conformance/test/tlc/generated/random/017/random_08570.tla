(*---
description: Evaluates a random function expression, seed 262, number 8570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([a |-> 2147483647, b |-> FALSE] = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)) @@ (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]) @@ [[x \in Nat |-> x + 1] EXCEPT ![7] = 3])) EXCEPT ![(((0 + 7)).a + ((2 + -1) % ([a |-> 1, b |-> TRUE] + 0)))] = LET b13281 == IF (FALSE \/ FALSE) THEN ([a |-> 1, b |-> TRUE]).a ELSE Head(<<1, 2>>) IN Len(SortSeq(<<>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08570 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
