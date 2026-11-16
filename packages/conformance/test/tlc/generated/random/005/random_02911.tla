(*---
description: Evaluates a random set expression, seed 262, number 2911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Head([<<1>> EXCEPT ![1] = -1]) .. Head(SelectSeq(<<1>>, LAMBDA e : e > 0))), DOMAIN [[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02911 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    "b"
---*)
