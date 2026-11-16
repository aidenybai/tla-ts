(*---
description: Evaluates a random function expression, seed 262, number 8924.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08924 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((CHOOSE b13838 \in {2, 1, 3} : FALSE) :> ([a |-> 1, b |-> TRUE] * 2147483647)) @@ ([b13839 \in 1..3 |-> b13839] @@ (-1 :> 3))) EXCEPT ![(-Len(Tail(<<3, 1, 2>>)))] = ([a |-> Len(<<3, 1, 2>>), b |-> ({1, 2} \subseteq SUBSET {1})] - ((2 % 3) - ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08924 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 54 of module random_08924
---*)
