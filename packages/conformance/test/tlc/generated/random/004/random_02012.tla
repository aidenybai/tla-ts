(*---
description: Evaluates a random bool expression, seed 262, number 2012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<5, 6>> EXCEPT ![3] = <<1>>])[([a |-> 1]).a] * Len((<<3, 1, 2>> \o <<1>>))) < (CASE (CHOOSE r \in [a : {}] : TRUE) -> (2 - 2147483647) [] OTHER -> (3 * 0) * ([b3191 \in {2, 1, 3} |-> b3191])[(-0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_02012
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02012 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 106 to line 14, col 133 of module random_02012
---*)
