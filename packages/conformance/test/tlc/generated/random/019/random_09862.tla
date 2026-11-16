(*---
description: Evaluates a random function expression, seed 262, number 9862.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09862 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([[b15316 \in {x \in 1..3 : x > 1} |-> b15316] EXCEPT ![(<<5, 6>> \div 1)] = (-3)] @@ [([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) EXCEPT ![(-7)] = LET b15317 == 2 IN 2]) EXCEPT ![Head(SubSeq([<<3, 1, 2>> EXCEPT ![1] = 0], IF FALSE THEN -1 ELSE 7, LET b15318 == 2 IN -1))] = {(CASE {1} -> 7 [] OTHER -> 7 % (1 - -1)), Len([<<>> EXCEPT ![1] = 2147483647])}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09862 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
