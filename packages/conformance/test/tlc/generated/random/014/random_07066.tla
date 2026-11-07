(*---
description: Evaluates a random set expression, seed 262, number 7066.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07066 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10855 \in (LET b10856 == 2147483647 IN 1 .. (7 % 2147483647)) : (\A b10857 \in UNION {{x \in 1..3 : x > 1}, Nat} : Tail(<<>>))) \in {((-1) \div (FALSE).a) : b10858 \in {b10859 \in ({x \in 1..3 : x > 1} \ {1}) : Len(<<3, 1, 2>>)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07066 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {2, 3}
---*)
