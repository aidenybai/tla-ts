(*---
description: Evaluates a random seq expression, seed 262, number 2993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality(UNION {(1 .. 2), {[a |-> 1], 3}}), ((Head(<<1, 2>>) - (CHOOSE b4754 \in 1..3 : FALSE)) * Cardinality(({1, 2} \cap {x \in 1..3 : x > 1})))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02993 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 3 with non-integer:
    [a |-> 1]
---*)
