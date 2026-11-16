(*---
description: Evaluates a random bool expression, seed 262, number 6580.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06580 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10106 \in ([(2 :> 7) EXCEPT ![(2 + -1)] = (7 + 2)] \ DOMAIN [[x \in 1..2 |-> x] EXCEPT ![-1] = 3]) : (CASE ([a |-> 1, b |-> TRUE] \subseteq {}) -> (-2) [] OTHER -> LET b10107 == 0 IN b10106 \div IF (0 \in {2, 1, 3}) THEN Cardinality(2..1) ELSE ((1 :> 2)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 34 to line 14, col 39 of module random_06580
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 82 to line 14, col 99 of module random_06580
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06580 failed.
    Attempted to enumerate S \ T when S:
    (2 :> 7)
    is not enumerable.
---*)
