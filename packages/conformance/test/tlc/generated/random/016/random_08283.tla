(*---
description: Evaluates a random bool expression, seed 262, number 8283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(-1 * (1 :> 2)), CASE TRUE -> -1 [] OTHER -> 1}, {Cardinality({1}) : b12826 \in (Nat \cap 1..3)}} \subseteq {b12827 \in {(-1 \div 2), CASE FALSE -> 7 [] OTHER -> 2} : (\A b12828 \in {b12829 \in {1, 2} : {2, 1, 3}} : (TRUE <=> TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08283 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
