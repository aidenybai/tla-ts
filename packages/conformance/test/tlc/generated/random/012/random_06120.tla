(*---
description: Evaluates a random bool expression, seed 262, number 6120.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06120 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b9420 \in (DOMAIN <<5, 6>> \ (Nat \cap {1, 2})) |-> Len([TRUE EXCEPT ![1] = b9420])] EXCEPT ![([[a |-> (1 :> 2), b |-> TRUE] EXCEPT !.a = (7 \div 3)]).a] = Head(SortSeq((<<>> \o <<1>>), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 101 of module random_06120
    | <<>>
---*)
