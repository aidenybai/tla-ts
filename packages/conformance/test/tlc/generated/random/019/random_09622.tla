(*---
description: Evaluates a random record expression, seed 262, number 9622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b14942 \in ({1, 2} \cup {2, 1, 3}) : (Nat = {1})) % (-(\A b14943 \in {} : FALSE))), b |-> (((CHOOSE b14944 \in SUBSET {1} : FALSE) - SubSeq(<<3, 1, 2>>, 2147483647, 2147483647)) = Head(SubSeq(<<3, 1, 2>>, 7, 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09622 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
---*)
