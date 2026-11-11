(*---
description: Evaluates a random record expression, seed 262, number 8457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 2..1] : TRUE) = [a |-> (CASE (1 :> 2) -> 2147483647 [] OTHER -> 7 - SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), b |-> ((\A b13087 \in Nat : TRUE) => [a |-> 2147483647, b |-> TRUE])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08457 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_08457
---*)
