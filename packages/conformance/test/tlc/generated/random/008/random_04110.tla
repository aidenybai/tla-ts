(*---
description: Evaluates a random bool expression, seed 262, number 4110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in Nat |-> x + 1])[1] :> Cardinality({})) @@ [b6457 \in (7 < 0) |-> CASE TRUE -> 0 [] OTHER -> {}]) \in DOMAIN [(CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE) EXCEPT ![(3 * 2)] = (3 + 2)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the boolean FALSE.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the boolean FALSE.
---*)
