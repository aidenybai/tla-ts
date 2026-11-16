(*---
description: Evaluates a random seq expression, seed 262, number 9016.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09016 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(<<Head([x \in 1..2 |-> x]), Head(<<1, 2>>)>>, (CASE TRUE -> 1 [] OTHER -> [a |-> 1] + (<<5, 6>>)[7])), (([b14007 \in 1..3 |-> b14007] @@ [[x \in Nat |-> x + 1] EXCEPT ![7] = 1]))[Len(SortSeq(<<1>>, LAMBDA p, q : p < q))], (((-3) = (3 - 2)) + IF (FALSE <=> FALSE) THEN (FALSE % 2147483647) ELSE Head(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09016 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
