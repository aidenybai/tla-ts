(*---
description: Evaluates a random int expression, seed 262, number 6331.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06331 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((3 - 3) * (3 \div 1))) - LET b9730 == ([<<5, 6>> EXCEPT ![3] = 7])[IF FALSE THEN 0 ELSE 1] IN [((1 :> 2) @@ [x \in 1..2 |-> x]) EXCEPT ![({} \ SUBSET {1})] = (-b9730)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06331 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
