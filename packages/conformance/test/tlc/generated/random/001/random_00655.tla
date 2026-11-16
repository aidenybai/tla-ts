(*---
description: Evaluates a random set expression, seed 262, number 655.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00655 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([b1093 \in UNION {Nat, {1}} |-> (b1093 + 3)])[((CHOOSE b1094 \in SUBSET {1} : FALSE) \div Head(<<>>))], ([b1095 \in UNION {{x \in 1..3 : x > 1}, 1..3} |-> (CHOOSE b1096 \in {1, 2} : FALSE)])[CASE ([a |-> 1] = [a |-> 1]) -> (<<5, 6>>)[-1] [] OTHER -> (2 - 2)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00655 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 66 to line 14, col 100 of module random_00655
---*)
