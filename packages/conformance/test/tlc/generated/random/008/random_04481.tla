(*---
description: Evaluates a random seq expression, seed 262, number 4481.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04481 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SubSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), CASE FALSE -> 1 [] OTHER -> 3, (0 * 1)), LAMBDA e : e > 0), (((0 \div [a |-> 1]) % Head(TRUE)) % Head(Tail(<<3, 1, 2>>))), Head(Append(SelectSeq(<<1>>, LAMBDA e : e > 0), Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04481 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
