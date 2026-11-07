(*---
description: Evaluates a random function expression, seed 262, number 6104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b9391 \in ({b9392 \in 1..3 : TRUE} \cup (2147483647 = 2147483647)) |-> ((<<3, 1, 2>> * 3) - ([x \in Nat |-> x + 1])[b9391])] @@ [b9393 \in ((2 - 1) .. (2 \div 2147483647)) |-> ((b9393 - b9393) \div IF TRUE THEN -1 ELSE 3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    TRUE
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    TRUE
    are not both enumerable
---*)
