(*---
description: Evaluates a random seq expression, seed 262, number 372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(<<((1 :> 2)).a, (-1 - 2)>>, LET b612 == (3 + 1) IN (b612 * 2147483647), ((2 \div 1) + Cardinality({x \in 1..3 : x > 1}))) \o <<([a |-> 0, b |-> TRUE]).a, Head(Tail(<<1, 2>>))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00372 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
