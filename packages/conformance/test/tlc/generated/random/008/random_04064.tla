(*---
description: Evaluates a random bool expression, seed 262, number 4064.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b6398 \in {((b6399 \div b6399) % (1 * 1)) : b6399 \in ({b6400 \in {1} : FALSE} \cup (0 .. 1))} : ((({1} \cup Nat) \subseteq UNION {2..1, 2..1}) => ({b6398 : b6401 \in {2, 1, 3}} \subseteq SelectSeq(TRUE, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04064 failed.
    2179:0 The second argument of \div is 0.
---*)
