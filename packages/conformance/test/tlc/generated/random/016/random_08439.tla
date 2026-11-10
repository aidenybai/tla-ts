(*---
description: Evaluates a random int expression, seed 262, number 8439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((0 :> 2) @@ [b13062 \in {x \in 1..3 : x > 1} |-> 2147483647]) EXCEPT ![(({1} \subseteq Nat) /\ (~TRUE))] = (([x \in Nat |-> x + 1])[-1] \div (<<5, 6>>)[3])])[Len([SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (2 - 2)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08439 failed.
    Attempted to check equality of integer 0 with non-integer:
    FALSE
---*)
