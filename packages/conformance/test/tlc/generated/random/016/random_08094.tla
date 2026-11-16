(*---
description: Evaluates a random record expression, seed 262, number 8094.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[UNION {Nat, 2..1} EXCEPT !.a = @ + (-2)] EXCEPT !.a = ((2 + 3) % CASE {2, 1, 3} -> 2147483647 [] OTHER -> 2)] EXCEPT !.a = (-(Head(<<1, 2>>) % (2 % 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08094 failed.
    Attempted to compare the set {} with the value:
    Nat
---*)
