(*---
description: Evaluates a random bool expression, seed 262, number 2643.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02643 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((1..3 \subseteq {1}) \/ Append(<<>>, 2)) \/ (SubSeq(FALSE, 2, 2) = ([x \in Nat |-> x + 1] @@ <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02643 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a tuple.
    line 14, col 20 to line 14, col 58 of module random_02643
---*)
