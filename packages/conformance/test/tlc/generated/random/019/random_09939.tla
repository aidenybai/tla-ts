(*---
description: Evaluates a random set expression, seed 262, number 9939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {[a |-> Len(<<1, 2>>), b |-> (\E b15461 \in {2, 1, 3} : FALSE)], (CHOOSE r \in [a : {1}] : TRUE)} \cap {Head((TRUE \/ TRUE)) : b15462 \in ((SUBSET {1} \ {1}) \cup (<<3, 1, 2>> \o <<3, 1, 2>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09939 failed.
    Attempted to enumerate S \cup T when S:
    {{}, {1}} \ {1}
    and T:
    <<3, 1, 2, 3, 1, 2>>
    are not both enumerable
---*)
