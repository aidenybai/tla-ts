(*---
description: Evaluates a random int expression, seed 262, number 1841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b2912 \in {b2913 \in (2 .. 0) : ({2, 1, 3} = (1 :> 2))} |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a])[LET b2914 == Cardinality(({2, 1, 3} \cup SUBSET {1})) IN (([x \in Nat |-> x + 1] @@ <<5, 6>>))[CASE TRUE -> 3 [] OTHER -> 2]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
