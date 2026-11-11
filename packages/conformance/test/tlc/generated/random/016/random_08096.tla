(*---
description: Evaluates a random int expression, seed 262, number 8096.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08096 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ({3, 0} = (SUBSET {1} \cup {})) THEN ((0 % 2) * LET b12502 == 2 IN b12502) ELSE (CHOOSE b12503 \in ({1} \cup {1}) : ({1, 2} = {1, 2})) + [[a |-> (2 + -1), b |-> (TRUE => FALSE)] EXCEPT !.a = ((3 - 0) % (7 * 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08096 failed.
    Attempted to check equality of integer 0 with non-integer:
    {}
---*)
