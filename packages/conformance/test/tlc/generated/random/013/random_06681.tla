(*---
description: Evaluates a random set expression, seed 262, number 6681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({[[a |-> [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1], b |-> (2 - 0)] EXCEPT ![(([a |-> 1]).a \div Cardinality([a |-> 1, b |-> TRUE]))] = (Head(<<>>) * Cardinality({1}))], CASE (([a |-> 1, b |-> TRUE] = [a |-> 1]) => (TRUE <=> FALSE)) -> LET b10243 == (-1 - 7) IN {0, -1} [] OTHER -> ((2147483647 :> 7))[Cardinality(SUBSET {1})]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06681 failed.
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1, b |-> TRUE]
---*)
