(*---
description: Evaluates a random bool expression, seed 262, number 9713.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09713 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {DOMAIN [x \in 1..2 |-> x], DOMAIN <<5, 6>>} \subseteq ((<<5, 6>>)[2] .. IF TRUE THEN -1 ELSE 0)) <=> (SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) = (([x \in 1..2 |-> x])[2] :> ([a |-> 1])[7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09713 failed.
    Attempted to access record by a non-string argument: 7
---*)
