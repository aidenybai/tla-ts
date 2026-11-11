(*---
description: Evaluates a random bool expression, seed 262, number 2822.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02822 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b4483 \in [[a |-> 1] EXCEPT !.a = 2147483647] : (~TRUE)} \cap {b4484 \in ({2, 1, 3} \cap SUBSET {1}) : ({2, 1, 3} \subseteq 1..3)}) \subseteq {b4485 \in (({1, 2} \cup SUBSET {1}) \cap UNION {{2, 1, 3}, {}}) : (({2, 1, 3} \cup {1, 2}) \subseteq {b4486 \in Nat : FALSE})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02822 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
