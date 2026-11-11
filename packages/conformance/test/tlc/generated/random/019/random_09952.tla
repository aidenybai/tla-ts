(*---
description: Evaluates a random seq expression, seed 262, number 9952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([<<(7 + -1), (2 \div 2147483647)>> EXCEPT ![1] = ((7 + 0) % Head(<<3, 1, 2>>))], (\A b15477 \in ((-1 % 1) .. (CHOOSE b15478 \in {} : FALSE)) : ((FALSE <=> TRUE) <=> (SUBSET {1} \ 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09952 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 160 of module random_09952
---*)
