(*---
description: Evaluates a random set expression, seed 262, number 6870.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06870 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(DOMAIN (1 :> 2) \ DOMAIN [x \in 1..2 |-> x]), (IF TRUE THEN -1 ELSE 7 .. (3 - 0))} \cup (Head(Tail(<<3, 1, 2>>)) .. (Head(<<3, 1, 2>>) - Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06870 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    {}
---*)
