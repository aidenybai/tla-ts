(*---
description: Evaluates a random function expression, seed 262, number 6785.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06785 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10407 \in ((CHOOSE b10408 \in {0 : b10409 \in {1, 2}} : (FALSE /\ TRUE)) .. Cardinality(([x \in 1..2 |-> x] \ {2, 1, 3}))) |-> (Len(SubSeq(<<3, 1, 2>>, (1 :> 2), 0)) - (CASE FALSE -> <<5, 6>> [] OTHER -> 2 * CASE FALSE -> 2147483647 [] OTHER -> 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06785 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 88 of module random_06785
---*)
