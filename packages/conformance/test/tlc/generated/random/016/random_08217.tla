(*---
description: Evaluates a random int expression, seed 262, number 8217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<5, 6>>)[3] * (2147483647 % 1)) * IF (FALSE \/ 3) THEN (CHOOSE b12718 \in <<1>> : TRUE) ELSE (3 % 2147483647)) + Len(SubSeq(<<2147483647, 2>>, LET b12719 == 3 IN <<1, 2>>, LET b12720 == 1 IN 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08217 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
