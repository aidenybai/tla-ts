(*---
description: Evaluates a random seq expression, seed 262, number 5840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((((2 + <<>>) * SubSeq(<<>>, 3, 1)) + Cardinality(UNION {{}, {2, 1, 3}})), (-((-7) + Len(<<>>))), ((IF FALSE THEN -1 ELSE 7 :> (CHOOSE b9003 \in {} : TRUE)))[(LET b9004 == -1 IN 7 * CASE TRUE -> 2 [] OTHER -> 1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05840 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
