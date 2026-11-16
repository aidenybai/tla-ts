(*---
description: Evaluates a random bool expression, seed 262, number 5941.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05941 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b9155 \in {([a |-> 2147483647, b |-> FALSE]).a, Len((<<1, 2>> \o <<1>>))} : ((CHOOSE b9156 \in DOMAIN [x \in 1..2 |-> x] : (<<1, 2>> = <<5, 6>>)) = LET b9157 == (b9155 \div b9155) IN Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05941 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 98 to line 14, col 163 of module random_05941
---*)
