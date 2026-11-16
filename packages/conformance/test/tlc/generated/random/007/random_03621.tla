(*---
description: Evaluates a random bool expression, seed 262, number 3621.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03621 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b5718 \in {Len(<<1, 2>>) : b5719 \in {1, 7}} : ((3 .. b5718) \subseteq ({1} \ 2..1))) /\ (IF ({} <=> FALSE) THEN (-1 - TRUE) ELSE (-2) = Len(SubSeq(<<>>, 3, 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03621 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 115 to line 14, col 126 of module random_03621
---*)
