(*---
description: Evaluates a random seq expression, seed 262, number 3607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF (3 = b5691) THEN Head(<<1, 2>>) ELSE Head(<<>>) : b5691 \in DOMAIN [b5692 \in {1} |-> b5692]} \cup {{(CHOOSE b5694 \in SUBSET {1} : TRUE) : b5693 \in (1..3 \cup {1, 2})}, (([a |-> 1, b |-> TRUE] @@ <<5, 6>>))[(7 - 3)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
