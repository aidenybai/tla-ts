(*---
description: Evaluates a random bool expression, seed 262, number 989.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00989 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b1588 \in {b1589 : b1589 \in -1} : (FALSE /\ TRUE)} \cup {CASE TRUE -> b1590 [] OTHER -> b1590 : b1590 \in (1..3 \cap 1..3)}) = UNION {(([a |-> 1]).a .. [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]), (UNION {SUBSET {1}, Nat} \ {b1591 \in SUBSET {1} : TRUE})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00989 failed.
    TLC encountered a non-enumerable quantifier bound
    -1.
    line 14, col 48 to line 14, col 49 of module random_00989
---*)
