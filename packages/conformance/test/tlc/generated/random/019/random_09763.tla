(*---
description: Evaluates a random int expression, seed 262, number 9763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b15160 \in ({2, 1, 3} \cup {1, 2}) |-> Head(<<1>>)] @@ [[b15161 \in SUBSET {1} |-> 2] EXCEPT ![Len(<<1>>)] = (3 \div 2147483647)]))[(Head((<<>> \o <<>>)) % ([[a |-> 1] EXCEPT !.a = @ + -1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09763 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
