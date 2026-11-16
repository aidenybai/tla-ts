(*---
description: Evaluates a random function expression, seed 262, number 4162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = -1]).a :> (<<2147483647, 2147483647>> \div (Nat).a)) @@ (CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04162 failed.
    Attempted to select field "a" from a non-record value Nat
    line 14, col 86 to line 14, col 92 of module random_04162
---*)
