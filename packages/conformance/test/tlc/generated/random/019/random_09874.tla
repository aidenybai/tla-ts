(*---
description: Evaluates a random record expression, seed 262, number 9874.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09874 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + Head(Append(<<>>, 2147483647))] EXCEPT !.a = @ + Cardinality(UNION {({x \in 1..3 : x > 1} \ Nat), (CHOOSE b15343 \in {2, 1, 3} : FALSE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09874 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
