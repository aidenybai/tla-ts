(*---
description: Evaluates a random bool expression, seed 262, number 14.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(<<CASE TRUE -> 1 [] OTHER -> 2147483647, (0 \div 1)>>, ((TRUE /\ TRUE)).a, Head(<<2, 2147483647>>)) = (CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00014 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 79 to line 14, col 96 of module random_00014
---*)
