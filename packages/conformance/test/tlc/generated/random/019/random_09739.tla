(*---
description: Evaluates a random record expression, seed 262, number 9739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a, b |-> (({x \in 1..3 : x > 1} = {}) = (<<>> .. 3))] EXCEPT !.a = @ + (((<<5, 6>>)[TRUE] + Head(<<3, 1, 2>>)) - ((CHOOSE b15120 \in 2..1 : TRUE) + (7 + 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09739 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
