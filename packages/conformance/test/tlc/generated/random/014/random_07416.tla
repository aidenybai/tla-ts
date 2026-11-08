(*---
description: Evaluates a random function expression, seed 262, number 7416.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07416 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Append(<<>>, 2)) :> Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))) @@ [(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT ![(((1 :> 2) % 0) * ([a |-> 1]).a)] = [a |-> IF FALSE THEN 2 ELSE 1, b |-> ([a |-> 1, b |-> TRUE] \subseteq {x \in 1..3 : x > 1})]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07416 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
