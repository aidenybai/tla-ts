(*---
description: Evaluates a random function expression, seed 262, number 7878.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07878 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b12164 \in UNION {-1, Nat} |-> (3 % b12164)] @@ {(3 + 3), (-2)}) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    -1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    -1
---*)
