(*---
description: Evaluates a random record expression, seed 262, number 2756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([b4350 \in (-1 .. 3) |-> (<<1, 2>>).a])[([a |-> 2147483647, b |-> FALSE]).a], b |-> (((-2147483647) * ([a |-> 1] % 2147483647)) = Len((<<>> \o <<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02756 failed.
    In applying the function
    [b4350 \in -1..3 |-> <expression line 14, col 49 to line 14, col 60 of module random_02756>],
    the first argument is:
    2147483647
    which is not in its domain.
---*)
