(*---
description: Evaluates a random int expression, seed 262, number 4025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((({2, 1, 3} = <<3, 1, 2>>) <=> (\A b6324 \in {2, 1, 3} : TRUE)) - (([x \in 1..2 |-> x])[0] % (<<5, 6>>)[1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04025 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    <<3, 1, 2>>
---*)
