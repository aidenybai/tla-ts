(*---
description: Evaluates a random bool expression, seed 262, number 3005.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03005 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({LET b4774 == -1 IN -1, (3 * 1)} \subseteq IF (\E b4775 \in {} : FALSE) THEN (-1 \div 0) ELSE (3 + 0)) <=> (((SUBSET {1} \subseteq [a |-> 1, b |-> TRUE]) => (-1 = 7)) <=> (\E b4776 \in SubSeq(<<1, 2>>, 2147483647, 2) : (<<1>> = (1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03005 failed.
    Attempted to check if the value:
    -1
    is an element of the integer 3
---*)
