(*---
description: Evaluates a random seq expression, seed 262, number 7736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b11933 \in ((2..1 \cap SUBSET {1}) \ {2 : b11934 \in {2, 1, 3}}) : (LET b11935 == 2147483647 IN 7 < [[a |-> 1, b |-> TRUE] EXCEPT !.a = b11933])) \o Tail([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT ![1] = LET b11936 == 7 IN 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07736 failed.
    Attempted to access record by a non-string argument: 1
---*)
