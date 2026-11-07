(*---
description: Evaluates a random set expression, seed 262, number 3795.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03795 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SelectSeq(SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0), LAMBDA e : e > 0)), (CHOOSE b5985 \in UNION {{b5986 : b5986 \in {1}}, DOMAIN <<5, 6>>} : ((b5985 \subseteq [x \in Nat |-> x + 1]) /\ (3 < 2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
