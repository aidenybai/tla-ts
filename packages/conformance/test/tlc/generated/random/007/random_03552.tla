(*---
description: Evaluates a random bool expression, seed 262, number 3552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] % LET b5618 == 2 IN <<1, 2>>) \in UNION {(Nat \ 2..1), (2..1 \subseteq {})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03552 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
