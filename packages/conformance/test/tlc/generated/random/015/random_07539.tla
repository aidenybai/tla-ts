(*---
description: Evaluates a random int expression, seed 262, number 7539.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07539 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b11619 == IF (\A b11620 \in {-1, 2} : (FALSE /\ TRUE)) THEN (-(7 * 1)) ELSE ((CHOOSE r \in [a : 2..1] : TRUE)).a IN CASE (<<b11619, 0>> = [[a |-> 1, b |-> TRUE] EXCEPT ![b11619] = 0]) -> ([<<5, 6>> EXCEPT ![b11619] = 2]).a [] OTHER -> ((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) @@ [(1 :> 2) EXCEPT ![b11619] = {}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07539 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 98 to line 14, col 127 of module random_07539
---*)
