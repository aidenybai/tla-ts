(*---
description: Evaluates a random set expression, seed 262, number 6321.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06321 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {{b9714 \in {2147483647 : b9715 \in 1..3} : (\E b9716 \in {1} : TRUE)}, ((2..1 \ {2, 1, 3}) \ DOMAIN [x \in 1..2 |-> x])}, DOMAIN ((2 * <<5, 6>>) :> ([x \in Nat |-> x + 1])[3])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06321 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
