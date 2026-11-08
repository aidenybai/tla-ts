(*---
description: Evaluates a random set expression, seed 262, number 2500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Head(Append(<<1>>, 0)) * Cardinality((SUBSET {1} \ {x \in 1..3 : x > 1}))), Head(SubSeq([<<3, 1, 2>> EXCEPT ![1] = 7], Len(FALSE), (2 \div 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02500 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    3
---*)
