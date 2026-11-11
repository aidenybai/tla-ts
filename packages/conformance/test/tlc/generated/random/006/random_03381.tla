(*---
description: Evaluates a random bool expression, seed 262, number 3381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b5367 \in (({b5368 \in SUBSET {1} : TRUE} \cup (3 .. 2147483647)) \cup ((-2147483647) < ([a |-> 1]).a)) : ({(2 % b5367), UNION {{1, 2}, {1}}} \subseteq ({b5369 \in {2, 1, 3} : FALSE} \ (Nat \cup {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03381 failed.
    Attempted to enumerate S \cup T when S:
    3..2147483647 \cup {{}, {1}}
    and T:
    TRUE
    are not both enumerable
---*)
