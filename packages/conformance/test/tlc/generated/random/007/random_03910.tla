(*---
description: Evaluates a random bool expression, seed 262, number 3910.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03910 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6164 \in UNION {{Len(<<1>>) : b6165 \in ({2, 1, 3} \cap Nat)}, DOMAIN (CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE)} : ({Len(<<>>), (0 \div b6164)} = (SubSeq(<<1, 2>>, b6164, b6164) \o (<<1>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03910 failed.
    Attempted to check equality of the set {0} with the value:
    <<1, 1, 3, 1, 2>>
---*)
