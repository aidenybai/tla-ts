(*---
description: Evaluates a random function expression, seed 262, number 5513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Head(<<1, 2>>), b |-> (FALSE => FALSE)] @@ (((1 :> 2) @@ [x \in 1..2 |-> x]) @@ (FALSE .. 1))) @@ (LET b8517 == (CHOOSE b8518 \in 1..3 : FALSE) IN (-3) :> ((CHOOSE b8519 \in 2..1 : FALSE) % LET b8520 == 0 IN 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05513 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
