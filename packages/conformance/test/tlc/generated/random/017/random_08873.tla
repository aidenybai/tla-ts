(*---
description: Evaluates a random bool expression, seed 262, number 8873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13742 \in DOMAIN [(CHOOSE f \in [{1} -> 1..2] : TRUE) EXCEPT ![[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]] = (CHOOSE b13743 \in 2..1 : FALSE)] : (Tail(SubSeq(<<1, 2>>, b13742, b13742)) \subseteq (DOMAIN <<5, 6>> \ {b13742, b13742}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08873 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
