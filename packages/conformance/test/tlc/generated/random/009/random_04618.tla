(*---
description: Evaluates a random bool expression, seed 262, number 4618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[TRUE EXCEPT !.a = @ + 3] EXCEPT !.a = @ + (2147483647 - 7)] = ((7 * 1) :> (0 \div TRUE))) => (CASE (~TRUE) -> Cardinality(Nat) [] OTHER -> (0 * 1) = LET b7229 == CASE TRUE -> 2147483647 [] OTHER -> 0 IN IF TRUE THEN b7229 ELSE 2)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04618 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
