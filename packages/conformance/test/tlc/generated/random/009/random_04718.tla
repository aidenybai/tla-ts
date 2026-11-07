(*---
description: Evaluates a random int expression, seed 262, number 4718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b7379 \in UNION {Nat, <<3, 1, 2>>} |-> (Nat \cup 1..3)] @@ {b7380 \in UNION {2..1, 2..1} : (TRUE <=> FALSE)}))[Len({(<<1>>).a, IF FALSE THEN 0 ELSE -1})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<3, 1, 2>> with the value:
    Nat
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<3, 1, 2>> with the value:
    Nat
---*)
