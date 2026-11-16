(*---
description: Evaluates a random set expression, seed 262, number 9190.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09190 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SubSeq([<<1>> EXCEPT ![1] = 1], (<<5, 6>>)[7], (-1 - 3))), (-[a |-> Head(<<1>>), b |-> ({2, 1, 3} \subseteq {})])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09190 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
