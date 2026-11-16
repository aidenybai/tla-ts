(*---
description: Evaluates a random seq expression, seed 262, number 407.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00407 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((Tail(Tail([x \in Nat |-> x + 1])) \o Tail([a |-> <<5, 6>>, b |-> FALSE])), (-Len((<<>> \o <<1, 2>>))), Len(((<<3, 1, 2>> \o TRUE) \o SubSeq(<<>>, {2, 1, 3}, 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00407 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Tail(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
