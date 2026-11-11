(*---
description: Evaluates a random seq expression, seed 262, number 128.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00128 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(UNION {DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![0] = 0], (UNION {<<3, 1, 2>>, {2, 1, 3}} \cup UNION {<<1, 2>>, SUBSET {1}})}, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00128 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.SelectSeq(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2, 3} with the value:
    <<3, 1, 2>>
---*)
