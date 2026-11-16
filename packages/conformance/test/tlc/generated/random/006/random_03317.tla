(*---
description: Evaluates a random seq expression, seed 262, number 3317.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03317 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([(([x \in Nat |-> x + 1] \/ TRUE) \o <<2147483647, <<>>>>) EXCEPT ![1] = ((3 \div 1) \div {1, 2})], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03317 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function of the form  [x \in S |-> expr].
    line 14, col 29 to line 14, col 57 of module random_03317
---*)
