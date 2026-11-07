(*---
description: Evaluates a random bool expression, seed 262, number 3037.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03037 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<CASE ({1} \subseteq {}) -> IF FALSE THEN 2147483647 ELSE 1 [] OTHER -> Len(<<3, 1, 2>>), ([(1 :> 2) EXCEPT ![2147483647] = 1])[(1 % 2)]>> = [b4830 \in DOMAIN (<<5, 6>> @@ [x \in Nat |-> x + 1]) |-> (-(1 * b4830))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 111 to line 14, col 116 of module random_03037
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
