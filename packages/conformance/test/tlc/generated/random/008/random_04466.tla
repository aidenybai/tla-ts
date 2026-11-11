(*---
description: Evaluates a random set expression, seed 262, number 4466.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04466 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7027 \in {(CHOOSE b7028 \in (1..3 \cap FALSE) : (<<1, 2>> = <<5, 6>>)), Len(SubSeq(<<>>, -1, -1))} : (([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] = [a |-> FALSE, b |-> FALSE]) /\ ((b7027 - b7027) < (1 % -1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04466 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
