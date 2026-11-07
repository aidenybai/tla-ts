(*---
description: Evaluates a random function expression, seed 262, number 7978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b12323 \in Tail(<<3, 1, 2>>) |-> (b12323 * b12323)] @@ (CHOOSE f \in [{1} -> {1}] : TRUE)) @@ ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = Len(<<1, 2>>)] @@ (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    The domains of formal parameters must be enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    The domains of formal parameters must be enumerable.
---*)
