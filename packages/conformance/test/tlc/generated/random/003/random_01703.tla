(*---
description: Evaluates a random set expression, seed 262, number 1703.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01703 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b2716 == (Head(<<>>) + Len(<<1>>)) IN (CHOOSE b2717 \in Append(<<3, 1, 2>>, b2716) : (SUBSET {1} = {x \in 1..3 : x > 1})), Len(Tail([<<>> EXCEPT ![1] = 3]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01703 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
