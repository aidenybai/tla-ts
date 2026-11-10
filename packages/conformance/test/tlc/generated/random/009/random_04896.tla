(*---
description: Evaluates a random int expression, seed 262, number 4896.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04896 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = Head(<<3, 1, 2>>)]).a % (([b7624 \in <<1, 2>> |-> 0] @@ [a |-> 2147483647, b |-> FALSE]))[CASE (~FALSE) -> (2147483647 % 2) [] OTHER -> CASE TRUE -> -1 [] OTHER -> -1]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04896 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_04896
---*)
