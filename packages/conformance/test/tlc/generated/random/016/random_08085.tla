(*---
description: Evaluates a random bool expression, seed 262, number 8085.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08085 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({2147483647 : b12493 \in {}} \subseteq UNION {{1}, 1..3}) /\ ((1..3 \cup [a |-> 1, b |-> TRUE]) \subseteq {1 : b12494 \in 1..3})) <=> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]).a = Cardinality(({} \ 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08085 failed.
    Attempted to enumerate S \cup T when S:
    1..3
    and T:
    [a |-> 1, b |-> TRUE]
    are not both enumerable
---*)
