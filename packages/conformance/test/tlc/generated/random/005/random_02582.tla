(*---
description: Evaluates a random record expression, seed 262, number 2582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> CASE FALSE -> 0 [] OTHER -> 1, b |-> UNION {SUBSET {1}, {x \in 1..3 : x > 1}}] EXCEPT !.a = @ + (Head(<<1>>) + ((1 :> 2))[1])] EXCEPT !.a = LET b4066 == Head(SubSeq(<<1>>, <<3, 1, 2>>, 2)) IN Cardinality({b4067 \in {1, 2} : FALSE})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02582 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 2 with non-integer:
    {}
---*)
