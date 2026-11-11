(*---
description: Evaluates a random function expression, seed 262, number 8184.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08184 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12656 \in DOMAIN ((FALSE <=> TRUE) => (SUBSET {1} \subseteq 1..3)) |-> Head({Head(<<1>>), (<<5, 6>>)[b12656]})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08184 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 28 to line 14, col 83 of module random_08184
---*)
