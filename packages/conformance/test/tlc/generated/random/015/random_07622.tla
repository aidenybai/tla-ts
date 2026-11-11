(*---
description: Evaluates a random record expression, seed 262, number 7622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> LET b11727 == 2 IN 3, b |-> (7 < 3)] EXCEPT !.a = @ + (([a |-> 1, b |-> TRUE] * 2147483647) - Head(<<3, 1, 2>>))] EXCEPT !.a = (Head(Append(<<1, 2>>, TRUE)) % (CHOOSE b11728 \in UNION {{}, {x \in 1..3 : x > 1}} : ({1} = {})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07622 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
