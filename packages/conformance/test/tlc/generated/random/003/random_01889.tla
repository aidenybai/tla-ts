(*---
description: Evaluates a random bool expression, seed 262, number 1889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<LET b2966 == SelectSeq(<<>>, LAMBDA e : e > 0) IN Len(<<>>), ((1 * 3) - (2 - 7))>> = (IF (TRUE \/ TRUE) THEN (1 + 3) ELSE (1 - 2) :> CASE ([a |-> 1] = 1) -> (3 \div 1) [] OTHER -> ({2, 1, 3} \cup {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01889 failed.
    Attempted to check equality of the function <<0, 8>> with the value:
    4
---*)
