(*---
description: Evaluates a random bool expression, seed 262, number 1223.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01223 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(LET b1962 == 2 IN b1962 \div Head(<<3, 1, 2>>)), Cardinality({b1963 : b1963 \in 2..1})} = LET b1964 == [a |-> CASE FALSE -> -1 [] OTHER -> 2147483647, b |-> (FALSE => FALSE)] IN (LET b1965 == b1964 IN b1965 + (CHOOSE b1966 \in Nat : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01223 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 229 to line 14, col 255 of module random_01223
---*)
