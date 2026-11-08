(*---
description: Evaluates a random seq expression, seed 262, number 435.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00435 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<LET b710 == ([x \in Nat |-> x + 1] % 2) IN LET b711 == b710 IN 2, ([[a |-> 1] EXCEPT !.a = 3]).a>> EXCEPT ![1] = (IF (TRUE /\ FALSE) THEN IF FALSE THEN 2 ELSE 2 ELSE ([x \in 1..2 |-> x] \div 0) + CASE Tail(<<1>>) -> (1 - 2) [] OTHER -> (-1 * 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00435 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
