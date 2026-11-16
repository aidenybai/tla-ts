(*---
description: Evaluates a random set expression, seed 262, number 472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head((SubSeq(<<1, 2>>, b779, 2) \o SelectSeq(<<1, 2>>, LAMBDA e : e > 0))) : b779 \in {b780 \in (({x \in 1..3 : x > 1} \cup {1, 2}) \ (1..3 \cap SUBSET {1})) : (\A b781 \in (Nat \ 1..3) : (\E b782 \in {1} : TRUE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00472 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
