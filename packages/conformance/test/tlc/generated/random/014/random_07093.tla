(*---
description: Evaluates a random function expression, seed 262, number 7093.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07093 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((2 .. <<5, 6>>) \subseteq (Nat \ 0)) THEN (Len([a |-> 1]) - (CHOOSE b10892 \in SUBSET {1} : TRUE)) ELSE ([[a |-> 1] EXCEPT !.a = @ + 2]).a :> (((<<5, 6>> @@ [a |-> 1]))[IF FALSE THEN -1 ELSE -1] % (CHOOSE b10893 \in (Nat \ {1, 2}) : (b10893 = -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07093 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
