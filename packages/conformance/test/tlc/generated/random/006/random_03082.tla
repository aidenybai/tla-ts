(*---
description: Evaluates a random int expression, seed 262, number 3082.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03082 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-3) \div (FALSE <=> FALSE)) - Cardinality({0 : b4902 \in Nat})) * UNION {(([a |-> 1, b |-> TRUE]).a .. CASE FALSE -> 1 [] OTHER -> <<1>>), {([a |-> 1, b |-> TRUE]).a : b4903 \in (1..3 \cup 2..1)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03082 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
