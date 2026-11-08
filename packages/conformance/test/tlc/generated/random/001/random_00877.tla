(*---
description: Evaluates a random record expression, seed 262, number 877.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00877 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0) * ([a |-> 7, b |-> <<1>>]).a), b |-> ([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = LET b1416 == 3 IN FALSE] = ([TRUE EXCEPT ![-1] = 3] @@ [b1417 \in 2..1 |-> b1417]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00877 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
