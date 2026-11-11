(*---
description: Evaluates a random bool expression, seed 262, number 4965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7732 == (CASE TRUE -> 1 [] OTHER -> 2 + (CHOOSE b7733 \in {x \in 1..3 : x > 1} : 3)) IN Head(Append(<<1, 2>>, b7732)) \in ((([a |-> 1]).a .. SortSeq(<<>>, LAMBDA p, q : p < q)) \cup {Len(<<1, 2>>) : b7734 \in DOMAIN <<5, 6>>})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04965 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
