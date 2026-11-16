(*---
description: Evaluates a random int expression, seed 262, number 9692.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09692 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b15035 == ((-(-3)) + Len((CHOOSE r \in [a : 2..1] : TRUE))) IN (((CHOOSE r \in [a : {1}] : TRUE)).a \div ([(1 :> 2) EXCEPT ![b15035] = b15035])[LET b15036 == b15035 IN b15036]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09692 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 46 to line 14, col 75 of module random_09692
---*)
