(*---
description: Evaluates a random bool expression, seed 262, number 3262.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03262 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (3 - 0)) = [(FALSE \/ FALSE) EXCEPT ![(1 \in 1..3)] = (7 \div 7)]) => ([([a |-> 1] = {1}) EXCEPT !.a = IF FALSE THEN 7 ELSE 7] \in {([a |-> 1]).a : b5193 \in (Nat \cap SUBSET {1})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03262 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
