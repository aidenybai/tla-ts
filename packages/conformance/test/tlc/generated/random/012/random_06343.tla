(*---
description: Evaluates a random record expression, seed 262, number 6343.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06343 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Len(<<1, 2>>), b |-> (<<>> = [x \in 1..2 |-> x])] EXCEPT !.a = @ + (-CASE TRUE -> FALSE [] OTHER -> 3)] EXCEPT !.a = Head((SelectSeq(<<>>, LAMBDA e : e > 0) \o [<<>> EXCEPT ![1] = 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06343 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
