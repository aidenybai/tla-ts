(*---
description: Evaluates a random bool expression, seed 262, number 377.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00377 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(7 * 2), (3 % 2)} = ({b622 : b622 \in {1, 2}} \cap UNION {{}, {x \in 1..3 : x > 1}})) <=> (<<(3 * 1), Cardinality(2..1)>> = ((7 % 3) :> (TRUE).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00377 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 155 to line 14, col 162 of module random_00377
---*)
