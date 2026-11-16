(*---
description: Evaluates a random bool expression, seed 262, number 7453.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07453 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b11491 \in ({1, 2} \cap 2..1) : (<<>> = <<5, 6>>)} \subseteq (~(~TRUE))) <=> ((([a |-> 1]).a \in (SUBSET {1} \ {x \in 1..3 : x > 1})) /\ (\A b11492 \in {b11493 : b11493 \in {2, 1, 3}} : (-1 < b11492)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07453 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
