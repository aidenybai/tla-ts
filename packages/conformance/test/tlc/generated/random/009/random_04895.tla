(*---
description: Evaluates a random int expression, seed 262, number 4895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((LET b7619 == 0 IN b7619 * CASE FALSE -> 0 [] OTHER -> 2147483647) < (Head(<<3, 1, 2>>) % (<<5, 6>> @@ [x \in Nat |-> x + 1]))) THEN LET b7620 == ((3 + 2147483647) * (CHOOSE b7621 \in -1 : TRUE)) IN (CHOOSE r \in [a : {1, 2}] : TRUE) ELSE (CHOOSE b7622 \in (({1} \cap {}) \cup {b7623 \in 2..1 : FALSE}) : (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) < ((1 :> 2))[2147483647])))
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
