(*---
description: Evaluates a random function expression, seed 262, number 7739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Append(<<3, 1, 2>>, 2)) :> ((1 % 1) % (2 + <<5, 6>>))) @@ (((1 % 3) :> (SUBSET {1} \cup 2..1)) @@ ((<<>> => FALSE) :> CASE TRUE -> -1 [] OTHER -> 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07739 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
