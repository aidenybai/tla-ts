(*---
description: Evaluates a random seq expression, seed 262, number 6499.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06499 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SortSeq(<<1, 1>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), ([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (2..1 * 2)]).a, CASE (~(<<1>> \o 2..1)) -> Head(SelectSeq(<<>>, LAMBDA e : e > 0)) [] OTHER -> ((CHOOSE b9993 \in Nat : TRUE) % (3 + 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06499 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)
