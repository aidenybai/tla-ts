(*---
description: Evaluates a random seq expression, seed 262, number 2160.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02160 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SelectSeq([<<>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0), ([[a |-> 1] EXCEPT !.a = 2]).a, ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + [a |-> 1, b |-> TRUE]]).a) \o SubSeq((SelectSeq(<<>>, LAMBDA e : e > 0) \o SortSeq(<<1>>, LAMBDA p, q : p < q)), LET b3412 == (<<5, 6>> \cup [a |-> 1, b |-> TRUE]) IN [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b3412], LET b3413 == (<<5, 6>>)[-1] IN (TRUE + b3413))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 35 to line 14, col 38 of module random_02160
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02160 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
