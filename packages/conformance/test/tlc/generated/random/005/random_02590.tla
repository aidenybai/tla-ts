(*---
description: Evaluates a random function expression, seed 262, number 2590.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02590 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE) @@ [b4081 \in {b4082 \in [[x \in Nat |-> x + 1] EXCEPT ![7] = 7] : (TRUE => FALSE)} |-> ([b4083 \in {2, 1, 3} |-> b4081])[([a |-> 1, b |-> TRUE]).a]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02590 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    [x \in Nat |-> <expression line 14, col 102 to line 14, col 106 of module random_02590>]
    is not enumerable
---*)
