(*---
description: Evaluates a random function expression, seed 262, number 8942.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08942 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CHOOSE b13869 \in {b13870 \in {1, 2} : FALSE} : <<b13869, b13869>>), b |-> (\A b13871 \in [TRUE EXCEPT !.a = @ + 7] : (\E b13872 \in {1} : FALSE))] :> (([b13873 \in {x \in 1..3 : x > 1} |-> 3])[Head(<<1>>)] - LET b13874 == (<<5, 6>>)[0] IN CASE TRUE -> 3 [] OTHER -> 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08942 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 90 of module random_08942
---*)
