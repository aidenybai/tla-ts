(*---
description: Evaluates a random seq expression, seed 262, number 7289.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07289 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq(Append(<<1, 2>>, 7), LAMBDA e : e > 0), IF (~FALSE) THEN ([a |-> 1, b |-> TRUE])[2] ELSE LET b11228 == 3 IN b11228) \o Tail({b11229 \in DOMAIN [a |-> 1, b |-> TRUE] : (b11229 = 2147483647)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07289 failed.
    Attempted to access record by a non-string argument: 2
---*)
