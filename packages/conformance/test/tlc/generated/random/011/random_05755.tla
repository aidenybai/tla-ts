(*---
description: Evaluates a random function expression, seed 262, number 5755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(7 :> 7) EXCEPT ![Head(<<1>>)] = CASE FALSE -> -1 [] OTHER -> 2147483647] @@ [b8861 \in (Nat \cup {}) |-> LET b8862 == b8861 IN 3]) @@ ((SubSeq(<<3, 1, 2>>, 1, 2147483647) = ([x \in 1..2 |-> x] @@ <<5, 6>>)) @@ SortSeq(Append(<<1>>, 1), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 25 of module random_05755
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
