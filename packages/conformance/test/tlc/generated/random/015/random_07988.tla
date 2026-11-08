(*---
description: Evaluates a random function expression, seed 262, number 7988.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07988 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12336 \in {Cardinality({b12337 \in 2147483647 : TRUE}), IF (TRUE => TRUE) THEN Head(<<1>>) ELSE [[a |-> 1] EXCEPT !.a = 1]} |-> <<CASE (<<>> = <<5, 6>>) -> (-b12336) [] OTHER -> Len(<<>>), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07988 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    2147483647
    is not enumerable
---*)
