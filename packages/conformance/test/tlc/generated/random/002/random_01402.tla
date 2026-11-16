(*---
description: Evaluates a random set expression, seed 262, number 1402.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01402 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((UNION {2..1, {1, 2}} \cup ({1, 2} \cap {})) \cup (([a |-> 1, b |-> TRUE] \ SUBSET {1}) \ (2..1 \ SUBSET {1}))), ((UNION {{2, 1, 3}, {}} \ (0 .. -1)) \cap [[a |-> -1, b |-> [a |-> 1, b |-> TRUE]] EXCEPT !.a = (7 % 2147483647)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01402 failed.
    Attempted to check if element:
    2
    is in the record:
    [a |-> 7, b |-> [a |-> 1, b |-> TRUE]]
---*)
