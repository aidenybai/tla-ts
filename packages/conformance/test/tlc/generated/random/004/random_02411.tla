(*---
description: Evaluates a random function expression, seed 262, number 2411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((-1 \div 2) :> [Nat EXCEPT ![<<3, 1, 2>>] = 7]) @@ [b3811 \in UNION {UNION {{1}, 1..3}, ({1, 2} \cap {x \in 1..3 : x > 1})} |-> Len(Append(<<1>>, 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02411 failed.
    Attempted to apply EXCEPT construct to the value Nat.
---*)
