(*---
description: Evaluates a random function expression, seed 262, number 2265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3568 \in UNION {(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE), DOMAIN (0 :> [a |-> 1, b |-> TRUE])} |-> {[([x \in 1..2 |-> x] @@ <<5, 6>>) EXCEPT ![(<<5, 6>> + b3568)] = Cardinality({})], (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]]}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02265 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {0} with the value:
    [a |-> 2]
---*)
