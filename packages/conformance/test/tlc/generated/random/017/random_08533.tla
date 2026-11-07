(*---
description: Evaluates a random record expression, seed 262, number 8533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b13223 \in (IF TRUE THEN 2 ELSE 7 .. Cardinality(SUBSET {1})) : ((b13223 % 3) .. Cardinality({x \in 1..3 : x > 1}))} \cup (({2147483647 : b13224 \in 2..1} \cup DOMAIN <<5, 6>>) \ {b13225 \in ([a |-> 1] \cap {}) : ([a |-> 1] = [a |-> 1, b |-> TRUE])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    2
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    2
    is not enumerable
---*)
