(*---
description: Evaluates a random bool expression, seed 262, number 308.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00308 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Tail(<<1>>)) + (-(1 * 2))) \in {(LET b517 == b516 IN 0 - (3 + b516)) : b516 \in (DOMAIN [x \in Nat |-> x + 1] \cup ({1} \ {}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00308 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    Nat
    are not both enumerable
---*)
