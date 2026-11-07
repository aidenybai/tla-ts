(*---
description: Evaluates a random bool expression, seed 262, number 8281.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08281 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 7 ELSE 0 :> (2147483647 - 2)) @@ {b12823 \in UNION {{2, 1, 3}, TRUE} : (FALSE <=> FALSE)}) \subseteq ((CASE FALSE -> 2 [] OTHER -> 2147483647 .. CASE TRUE -> 2 [] OTHER -> 1) \subseteq (({2, 1, 3} \cap {1}) \cap (2..1 \ 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean TRUE with non-boolean:
    {1, 2, 3}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean TRUE with non-boolean:
    {1, 2, 3}
---*)
