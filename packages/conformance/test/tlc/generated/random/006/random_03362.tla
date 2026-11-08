(*---
description: Evaluates a random record expression, seed 262, number 3362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5339 \in [[a |-> (2 - -1), b |-> (2147483647 < 3)] EXCEPT !.a = @ + CASE (FALSE \/ TRUE) -> Append(<<3, 1, 2>>, 1) [] OTHER -> Len(<<1, 2>>)] : (~(~(SUBSET {1} = {1, 2})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03362 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
