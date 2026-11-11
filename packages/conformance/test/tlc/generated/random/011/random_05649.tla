(*---
description: Evaluates a random bool expression, seed 262, number 5649.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05649 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} .. 7) \cup (SUBSET {1} \ {2, 1, 3})) \subseteq (\E b8725 \in {b8726 \in 2..1 : FALSE} : (FALSE <=> FALSE))) /\ ({LET b8727 == 2 IN 2, Len(<<1, 2>>)} \subseteq UNION {DOMAIN (1 :> 2), {3 : b8728 \in 1..3}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05649 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue
---*)
