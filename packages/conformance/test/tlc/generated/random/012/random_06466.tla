(*---
description: Evaluates a random int expression, seed 262, number 6466.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06466 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9957 \in DOMAIN [[b9958 \in 1..3 |-> b9958] EXCEPT ![(7 % 1)] = Append(<<1, 2>>, 1)] : [[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (b9957 \div b9957)] EXCEPT !.a = <<(b9957 - b9957), LET b9959 == -1 IN b9959>>]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 42 to line 14, col 67 of module random_06466
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06466 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 115 to line 14, col 144 of module random_06466
---*)
