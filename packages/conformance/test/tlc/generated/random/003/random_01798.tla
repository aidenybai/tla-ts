(*---
description: Evaluates a random record expression, seed 262, number 1798.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01798 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + LET b2848 == (<<5, 6>>)[-1] IN CASE FALSE -> 3 [] OTHER -> b2848] EXCEPT !.a = @ + Head(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), Head(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01798 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
