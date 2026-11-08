(*---
description: Evaluates a random bool expression, seed 262, number 9829.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09829 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> Head(<<1>>), b |-> (-1 < 0)] EXCEPT !.a = @ + (-(7 * 2147483647))] = [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = CASE {b15259 \in SUBSET {1} : TRUE} -> (0 * 2147483647) [] OTHER -> (2 % 0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09829 failed.
    2178:0 Overflow when computing 7*2147483647
---*)
