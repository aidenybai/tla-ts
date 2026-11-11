(*---
description: Evaluates a random bool expression, seed 262, number 4342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6840 \in UNION {{Head(<<>>) : b6841 \in (1..3 \cap {x \in 1..3 : x > 1})}, DOMAIN (Nat :> <<3, 1, 2>>)} : (\A b6842 \in DOMAIN [<<5, 6>> EXCEPT ![b6840] = b6840] : ((b6842 * b6840) = Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04342 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
