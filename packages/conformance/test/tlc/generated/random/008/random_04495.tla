(*---
description: Evaluates a random set expression, seed 262, number 4495.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04495 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b7064 \in ((7 .. 1) \cup SubSeq(<<>>, 0, 1)) : (Len(<<1>>) < (b7064 * b7064))}, (({b7065 \in Nat : TRUE} = (TRUE \ {})) \ {b7066 \in ({1, 2} \ {1, 2}) : (TRUE <=> TRUE)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04495 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
