(*---
description: Evaluates a random record expression, seed 262, number 4260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = @ + Cardinality({1, 2})] EXCEPT !.a = Len(Tail(<<1>>))] EXCEPT !.a = @ + (((CHOOSE b6703 \in SUBSET {1} : TRUE) + (CHOOSE b6704 \in {1, 2} : TRUE)) - ((7 - 2) % Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04260 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
