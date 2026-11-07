(*---
description: Evaluates a random seq expression, seed 262, number 6845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq((<<-1, 7>> \o SelectSeq(<<>>, LAMBDA e : e > 0)), ([<<5, 6>> EXCEPT ![-1] = 2] * IF FALSE THEN 7 ELSE 2), (CHOOSE b10492 \in (3 .. 3) : (\A b10493 \in {1, 2} : FALSE))), Len(SortSeq([<<>> EXCEPT ![1] = 1], LAMBDA p, q : p < q)), ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = (-1 * 2)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 82 to line 14, col 89 of module random_06845
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
