(*---
description: Evaluates a random set expression, seed 262, number 4498.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04498 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b7067 \in UNION {{x \in 1..3 : x > 1}, {1, 2}} : (<<5, 6>> @@ [x \in Nat |-> x + 1])} \ (Head(<<1>>) .. CASE TRUE -> 0 [] OTHER -> 0)) \ (Len(SubSeq(<<>>, 0, -1)) .. LET b7068 == ([a |-> 1, b |-> TRUE]).a IN Head(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04498 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
