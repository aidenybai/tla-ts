(*---
description: Evaluates a random set expression, seed 262, number 7644.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07644 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b11762 \in UNION {[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (2..1 - -1)], (({} \ {}) \ {b11763 \in (1 :> 2) : FALSE})} : ([[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = @ + Head(<<>>)] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = (b11762 + 0)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07644 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    [a |-> 2..2]
---*)
