(*---
description: Evaluates a random bool expression, seed 262, number 3576.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03576 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({-1 : b5642 \in {}} \cup (2..1 \cap SUBSET {1})) \cup UNION {UNION {Nat, {1}}, (7 .. 1)}) = UNION {Append(<<7, -1>>, (1 + 0)), {Head(<<>>), Len(<<>>)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03576 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
