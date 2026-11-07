(*---
description: Evaluates a random set expression, seed 262, number 6368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b9790 == 1 IN b9790 .. Len(<<1>>)) \cup (Head(<<1>>) .. (-0))) \cup (Cardinality({b9791 : b9791 \in 1..3}) \ {CASE TRUE -> [x \in 1..2 |-> x] [] OTHER -> -1 : b9792 \in ({} \cup {1, 2})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    3
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    3
    is not enumerable.
---*)
