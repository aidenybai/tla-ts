(*---
description: Evaluates a random bool expression, seed 262, number 6172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + LET b9490 == 2147483647 IN b9490] < (LET b9491 == 2147483647 IN b9491 \div (7 + -1))) \/ (Tail(Append(<<1>>, 3)) = {CASE FALSE -> -1 [] OTHER -> 1, (<<5, 6>>)[-1]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06172 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_06172
---*)
