(*---
description: Evaluates a random int expression, seed 262, number 8826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b13665 == Cardinality(DOMAIN [a |-> 3, b |-> TRUE]) IN (CHOOSE b13666 \in (DOMAIN <<5, 6>> \cap (b13665 .. b13665)) : SelectSeq(SubSeq(<<>>, b13665, -1), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 76 to line 14, col 190 of module random_08826
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 76 to line 14, col 190 of module random_08826
---*)
