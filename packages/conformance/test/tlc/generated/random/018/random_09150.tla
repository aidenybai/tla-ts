(*---
description: Evaluates a random record expression, seed 262, number 9150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = (1 - [a |-> 1, b |-> TRUE])] EXCEPT !.a = @ + (CHOOSE b14213 \in {2147483647, -1} : (7 < b14213))] EXCEPT !.a = @ + ((([x \in 1..2 |-> x] @@ <<1>>) @@ (2147483647 :> 0)))[(-(CHOOSE r \in [a : {2, 1, 3}] : TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09150 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
