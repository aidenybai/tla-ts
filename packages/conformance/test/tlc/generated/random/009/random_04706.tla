(*---
description: Evaluates a random record expression, seed 262, number 4706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((LET b7362 == -1 IN 2 :> (7 + -1)))[((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE))[UNION {{x \in 1..3 : x > 1}, {1, 2}}]], b |-> (~((<<3, 1, 2>> = [x \in 1..2 |-> x]) \/ (<<1, 2>> = <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04706 failed.
    Attempted to check equality of integer 0 with non-integer:
    {1, 2, 3}
---*)
