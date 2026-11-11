(*---
description: Evaluates a random record expression, seed 262, number 5118.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05118 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality({b7957 \in FALSE : FALSE}), b |-> (\A b7958 \in (-1 .. 3) : (TRUE /\ TRUE))] EXCEPT !.a = Len(Tail(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05118 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    FALSE
    is not enumerable
---*)
