(*---
description: Evaluates a random function expression, seed 262, number 3769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE) @@ ([b5947 \in (CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE) |-> (CHOOSE b5948 \in {} : FALSE)] @@ (CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03769 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    The domains of formal parameters must be enumerable.
---*)
