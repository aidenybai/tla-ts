(*---
description: Evaluates a random set expression, seed 262, number 7686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF ((\E b11840 \in {} : TRUE) \/ ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) THEN (IF TRUE THEN 2147483647 ELSE 2 - (1 - 7)) ELSE IF (Nat \subseteq {1}) THEN (2 % 0) ELSE (CHOOSE b11841 \in {x \in 1..3 : x > 1} : FALSE), (CHOOSE b11842 \in ((2 .. 2147483647) \ {-1, 0}) : ((FALSE /\ FALSE) => (\A b11843 \in SUBSET {1} : TRUE)))})
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
