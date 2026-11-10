(*---
description: Evaluates a random set expression, seed 262, number 8383.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08383 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((Nat \subseteq {2, 1, 3}) + (CHOOSE b12969 \in 2..1 : TRUE)) \div UNION {DOMAIN [x \in Nat |-> x + 1], UNION {SUBSET {1}, 0}}), CASE (Head(<<1, 2>>) \in {-1, 2147483647}) -> LET b12970 == (-0) IN (-2) [] OTHER -> (Cardinality(2..1) \div ([x \in Nat |-> x + 1])[2147483647])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08383 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 20 to line 14, col 42 of module random_08383
---*)
