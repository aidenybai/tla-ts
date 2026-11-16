(*---
description: Evaluates a random seq expression, seed 262, number 4911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([a |-> (IF FALSE THEN 7 ELSE 1 + (0 * (1 :> 2))), b |-> (\A b7643 \in {2147483647 : b7644 \in SUBSET {1}} : (\E b7645 \in {2, 1, 3} : FALSE))], Len(SubSeq([<<3, 1, 2>> EXCEPT ![1] = -1], Cardinality(1..3), LET b7646 == 1 IN 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04911 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
