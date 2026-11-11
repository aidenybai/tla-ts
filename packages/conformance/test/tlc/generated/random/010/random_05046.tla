(*---
description: Evaluates a random set expression, seed 262, number 5046.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b7842 \in ({2 : b7843 \in {1}} \subseteq {b7844 \in {x \in 1..3 : x > 1} : FALSE}) : ((\E b7845 \in 2..1 : FALSE) => (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE))} \cup {b7846 \in ((~TRUE) => ({2, 1, 3} = 1..3)) : (DOMAIN [x \in 1..2 |-> x] \subseteq {b7847 : b7847 \in {1, 2}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05046 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    FALSE
    is not enumerable
---*)
