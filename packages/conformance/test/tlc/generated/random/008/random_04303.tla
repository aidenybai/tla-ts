(*---
description: Evaluates a random seq expression, seed 262, number 4303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((CHOOSE b6781 \in UNION {(2147483647 .. 0), DOMAIN [x \in 1..2 |-> x]} : ((\E b6782 \in SUBSET {1} : TRUE) \/ (2..1 = 2..1))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04303 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    1
---*)
