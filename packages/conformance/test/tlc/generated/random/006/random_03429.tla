(*---
description: Evaluates a random set expression, seed 262, number 3429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(CHOOSE b5434 \in (SUBSET {1} \cup [a |-> 1]) : (7 \in Nat)), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a}, {b5435 \in {b5436 \in {b5437 \in 1..3 : FALSE} : (b5436 \in SUBSET {1})} : ((Nat \subseteq {2, 1, 3}) /\ (~FALSE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03429 failed.
    Attempted to enumerate S \cup T when S:
    {{}, {1}}
    and T:
    [a |-> 1]
    are not both enumerable
---*)
