(*---
description: Evaluates a random bool expression, seed 262, number 6999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b10723 \in (UNION {SUBSET {1}, {}} \cup (1..3 \cup Nat)) : SortSeq(<<0, 1>>, LAMBDA p, q : p < q)} = {([a |-> b10724, b |-> FALSE]).a : b10724 \in {(0 % <<3, 1, 2>>), Cardinality({1, 2})}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06999 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
