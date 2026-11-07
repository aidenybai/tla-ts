(*---
description: Evaluates a random set expression, seed 262, number 8351.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08351 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12920 \in ({b12921 \in {x \in 1..3 : x > 1} : TRUE} \cap (Nat \cup {})) : ({-1, -1} = ({1} \cap SUBSET {1}))} \cup ({b12922 \in (3 .. 7) : (\A b12923 \in {1} : TRUE)} \cap ({7 : b12924 \in {1, 2}} \cup {b12925 : b12925 \in 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08351 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
