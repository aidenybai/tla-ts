(*---
description: Evaluates a random record expression, seed 262, number 7078.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (<<3, 7>>)[IF FALSE THEN 2147483647 ELSE 0]] EXCEPT !.a = @ + (-(CASE TRUE -> -1 [] OTHER -> 0 % Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07078 failed.
    Attempted to access index 0 of tuple
    <<3, 7>>
    which is out of bounds.
---*)
