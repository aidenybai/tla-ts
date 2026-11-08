(*---
description: Evaluates a random int expression, seed 262, number 4885.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04885 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[Append(Tail(<<1>>), (3 .. 3)) EXCEPT ![1] = (-IF FALSE THEN 2 ELSE 2)] EXCEPT ![1] = (-IF (TRUE => TRUE) THEN [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] ELSE (CHOOSE b7608 \in Nat : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04885 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
