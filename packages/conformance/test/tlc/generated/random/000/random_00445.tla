(*---
description: Evaluates a random record expression, seed 262, number 445.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00445 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Len(<<3, 1, 2>>), b |-> (<<1, 2>> = <<5, 6>>)] EXCEPT !.a = @ + (CHOOSE r \in [a : {0} \cup {1}] : TRUE)] EXCEPT !.a = @ + ([a |-> Cardinality({1}), b |-> (\A b727 \in {1} : TRUE)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00445 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
