(*---
description: Evaluates a random seq expression, seed 262, number 828.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00828 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SortSeq(Append(<<>>, 2147483647), LAMBDA p, q : p < q), ((1..3 % 3) - (3 + 7))) EXCEPT ![1] = IF (<<3, 0>> /\ (TRUE => TRUE)) THEN Head(SubSeq(<<>>, SUBSET {1}, 1)) ELSE (CHOOSE b1351 \in (2147483647 .. 2147483647) : (3 = b1351))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00828 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)
