(*---
description: Evaluates a random record expression, seed 262, number 6915.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06915 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) @@ ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) -> ((7 * 2) \div ([x \in Nat |-> x + 1])[2]) [] OTHER -> (CHOOSE b10582 \in (2..1 \ Nat) : (\E b10583 \in Nat : FALSE)), b |-> (((CHOOSE r \in [a : 1..2] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]) \/ ({b10584 \in {} : FALSE} \subseteq (0 .. 2147483647)))])
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
