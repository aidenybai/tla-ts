(*---
description: Evaluates a random bool expression, seed 262, number 3780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(<<Cardinality({}), ([a |-> 1, b |-> TRUE]).a>>, Cardinality((Nat \cap {x \in 1..3 : x > 1})), Cardinality((0 .. 2147483647))) = (CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03780 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Size of interval value exceeds the maximum representable size (32bits): 0..2147483647.
---*)
