(*---
description: Evaluates a random set expression, seed 262, number 296.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00296 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(UNION {UNION {{1, 2}, {1}}, (Nat \cup 1..3)} \cap {([x \in 1..2 |-> x])[7], (CHOOSE b493 \in {2, 1, 3} : TRUE)}), ((({1} \cup {}) \ ({1, 2} \ Nat)) \ (Cardinality(2..1) \div (2 % 7)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00296 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)
