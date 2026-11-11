(*---
description: Evaluates a random seq expression, seed 262, number 9808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = Head(<<1>>)]).a, LET b15220 == ([[a |-> 1] EXCEPT !.a = @ + 0])[(-0)] IN LET b15221 == (SUBSET {1})[b15220] IN (3 \div 1)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09808 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 50 of module random_09808
---*)
