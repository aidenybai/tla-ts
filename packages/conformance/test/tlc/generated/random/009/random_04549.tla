(*---
description: Evaluates a random int expression, seed 262, number 4549.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04549 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((CASE FALSE -> 7 [] OTHER -> 1 < (2 * 3)) <=> ((CHOOSE r \in [a : 2..1] : TRUE) = (1..3 \cup {1, 2}))) THEN (-(CHOOSE b7134 \in ({} \ {1}) : ([a |-> 1] = [a |-> 1, b |-> TRUE]))) ELSE ((([x \in 1..2 |-> x])[2] .. (2 .. 0)) \ DOMAIN [[x \in 1..2 |-> x] EXCEPT ![7] = 2147483647]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04549 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 68 to line 14, col 97 of module random_04549
---*)
