(*---
description: Evaluates a random int expression, seed 262, number 5669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b8745 \in UNION {DOMAIN [x \in 1..2 |-> x], (0 .. 2147483647)} |-> Len(Append(<<1, 2>>, b8745))])[(CHOOSE b8746 \in ((2..1 \ SUBSET {1}) \ (2..1 \cap [a |-> 1])) : ((<<3, 1, 2>> = <<5, 6>>) \/ (2 < b8746)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05669 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 117 to line 14, col 222 of module random_05669
---*)
