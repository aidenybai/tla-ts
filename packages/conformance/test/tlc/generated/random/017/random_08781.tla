(*---
description: Evaluates a random record expression, seed 262, number 8781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Cardinality({b13598 \in [x \in 1..2 |-> x] : TRUE}) * Head(Append(<<>>, 1))), b |-> (Cardinality({b13599 \in SUBSET {1} : TRUE}) \in ((CHOOSE r \in [a : 2..1] : TRUE) \cup ({x \in 1..3 : x > 1} \cap {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08781 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<1, 2>>
    is not enumerable
---*)
