(*---
description: Evaluates a random bool expression, seed 262, number 4593.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04593 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(<<(CHOOSE b7197 \in {} : TRUE), (-1 % 7)>>, LAMBDA e : e > 0) = ([[[x \in 1..2 |-> x] EXCEPT ![1] = 1] EXCEPT ![LET b7198 == 2147483647 IN b7198] = CASE FALSE -> 3 [] OTHER -> 7] @@ ([(1 :> 2) EXCEPT ![2] = 0] @@ [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = <<5, 6>>]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04593 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 55 of module random_04593
---*)
