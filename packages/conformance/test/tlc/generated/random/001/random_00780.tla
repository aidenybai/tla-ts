(*---
description: Evaluates a random function expression, seed 262, number 780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b1280 \in {b1281 \in ({} \cup {1}) : (<<1>> = <<5, 6>>)} |-> (Append(<<1, 2>>, b1280) \o [<<1>> EXCEPT ![1] = b1280])] @@ ([b1282 \in {b1283 \in {1, 2} : FALSE} |-> LET b1284 == b1282 IN 1] @@ ((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) @@ [b1285 \in Nat |-> [a |-> 1, b |-> TRUE]]))))
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
