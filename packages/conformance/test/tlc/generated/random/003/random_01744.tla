(*---
description: Evaluates a random bool expression, seed 262, number 1744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq((<<1>> \o <<3, 1, 2>>), (3 * 0), LET b2769 == 7 IN b2769)) \in ((UNION {0, 1..3} \ (SUBSET {1} \cup {2, 1, 3})) \ ({2, FALSE} \cap {-1 : b2770 \in 2..1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01744 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 3, 1, 2>>
    , but instead it is
    0
---*)
