(*---
description: Evaluates a random set expression, seed 262, number 7306.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07306 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE), ({b11256 \in DOMAIN [x \in Nat |-> x + 1] : (b11256 = 0)} \cup UNION {({2, 1, 3} \cap {x \in 1..3 : x > 1}), {b11257 \in 1..3 : TRUE}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
