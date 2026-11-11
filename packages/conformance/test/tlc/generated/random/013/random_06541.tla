(*---
description: Evaluates a random seq expression, seed 262, number 6541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(<<([a |-> 1] \ {1}), (1 % 2)>>, LAMBDA e : e > 0), (Len(<<{2, 1, 3}, 0>>) * ((TRUE => FALSE) * (1 * 0))), LET b10057 == (CHOOSE b10058 \in DOMAIN [x \in 1..2 |-> x] : (b10058 = 2)) IN Cardinality(({x \in 1..3 : x > 1} \cup 1..3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06541 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    [a |-> 1] \ {1}
---*)
