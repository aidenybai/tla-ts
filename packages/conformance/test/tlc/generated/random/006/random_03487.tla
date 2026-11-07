(*---
description: Evaluates a random function expression, seed 262, number 3487.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03487 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) @@ [[b5508 \in {2147483647 : b5509 \in 1..3} |-> ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])] EXCEPT ![((<<5, 6>>)[7] - LET b5510 == 0 IN b5510)] = LET b5511 == (CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE) IN LET b5512 == 3 IN b5512]))
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
