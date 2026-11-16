(*---
description: Evaluates a random record expression, seed 262, number 94.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([LET b143 == ((3 % 2) % (-1 \div 2)) IN Len((<<1>> \o <<1>>)) EXCEPT !.a = (CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> (-1 = 1) [] OTHER -> IF TRUE THEN -1 ELSE 1 % (IF FALSE THEN 3 ELSE -1 % CASE <<1, 2>> -> 7 [] OTHER -> -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00094 failed.
    Attempted to apply EXCEPT construct to the value 2.
---*)
