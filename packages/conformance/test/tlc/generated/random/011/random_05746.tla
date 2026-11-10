(*---
description: Evaluates a random record expression, seed 262, number 5746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b8846 == [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (-1 \div 1)] IN ((3 + 1) * IF FALSE THEN b8846 ELSE b8846), Len([[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = (7 - 7)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05746 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
