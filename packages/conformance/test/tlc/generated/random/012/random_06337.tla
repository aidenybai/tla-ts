(*---
description: Evaluates a random function expression, seed 262, number 6337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([[x \in 1..2 |-> x] EXCEPT ![1] = 1]).a :> [(CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) EXCEPT ![(2147483647 :> 2147483647)] = (CHOOSE b9738 \in {1} : TRUE)]) EXCEPT ![(-(([a |-> 1]).a \div (<<5, 6>>)[7]))] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = ([a |-> 1]).a]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06337 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
