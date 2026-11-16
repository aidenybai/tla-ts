(*---
description: Evaluates a random bool expression, seed 262, number 4344.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04344 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<SubSeq(<<>>, 3, 2), (3 % 2147483647)>> EXCEPT ![1] = Cardinality(DOMAIN [x \in 1..2 |-> x])] \/ ((\A b6843 \in (SUBSET {1} \cup {1, 2}) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) => (~(TRUE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04344 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a tuple.
    line 14, col 17 to line 14, col 229 of module random_04344
---*)
