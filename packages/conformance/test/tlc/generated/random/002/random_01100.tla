(*---
description: Evaluates a random function expression, seed 262, number 1100.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01100 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (~(TRUE => TRUE)) THEN (SubSeq(<<1, 2>>, 2, 3) \o SubSeq(<<1>>, 2, 2)) ELSE {(-1 + 3), (-1 * 1)} :> (CHOOSE b1754 \in (({1, 2} \cap 2..1) \cup (SUBSET {1} \cap 1..3)) : ((7 + b1754) < Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01100 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
