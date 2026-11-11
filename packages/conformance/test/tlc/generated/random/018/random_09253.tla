(*---
description: Evaluates a random function expression, seed 262, number 9253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE f \in [{} -> {1}] : TRUE) EXCEPT ![(2 - 3)] = Head(<<>>)] @@ (({1, 2} @@ [x \in 1..2 |-> x]) @@ (CHOOSE f \in [{2, 1, 3} -> {}] : TRUE))) @@ [[b14364 \in UNION {{}, Nat} |-> Head(<<3, 1, 2>>)] EXCEPT ![(([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) @@ ([x \in Nat |-> x + 1] @@ <<5, 6>>))] = Head(<<2147483647, FALSE>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 50 of module random_09253
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09253 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {1, 2}
---*)
