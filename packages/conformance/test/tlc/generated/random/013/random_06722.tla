(*---
description: Evaluates a random function expression, seed 262, number 6722.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06722 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10306 \in ((UNION {Nat, {1}} \ {b10307 \in {1} : FALSE}) \cup UNION {{2 : b10308 \in {1, 2}}, DOMAIN SUBSET {1}}) |-> (((-0) * {3 : b10309 \in {}}) % ((b10306 % b10306) \div (-2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06722 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form SUBSET S)
    line 14, col 112 to line 14, col 128 of module random_06722
---*)
