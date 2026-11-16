(*---
description: Evaluates a random bool expression, seed 262, number 520.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00520 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b875 \in {7 : b876 \in 2..1} : (<<1>> \o <<>>)) * (LET b877 == 2 IN 3 \div (-1))), b |-> (\E b878 \in ({3 : b879 \in {x \in 1..3 : x > 1}} \cap {0 : b880 \in {1}}) : (((1 :> 2))[3] \in (2..1 \ SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00520 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 77 of module random_00520
---*)
