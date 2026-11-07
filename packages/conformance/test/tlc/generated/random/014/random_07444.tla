(*---
description: Evaluates a random function expression, seed 262, number 7444.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07444 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((FALSE <=> FALSE) @@ (<<5, 6>> @@ <<5, 6>>)) EXCEPT ![(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) + Len(<<3, 1, 2>>))] = LET b11477 == [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] IN (0 % 3)] @@ (IF (3 = 2) THEN (-1) ELSE Head(<<3, 1, 2>>) :> ((FALSE <=> FALSE) - Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
---*)
