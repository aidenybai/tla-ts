(*---
description: Evaluates a random function expression, seed 262, number 126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b196 \in (UNION {{b197 \in 1..3 : FALSE}, ([x \in 1..2 |-> x] @@ <<5, 6>>)} \cap {(-7), IF TRUE THEN 2147483647 ELSE -1}) |-> ((Len(<<1>>) + (b196 % b196)) % ((-1 \div b196) \div (7 * 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00126 failed.
    Attempted to compare the function <<1, 2>> with the value:
    {}
---*)
