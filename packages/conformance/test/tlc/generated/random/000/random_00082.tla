(*---
description: Evaluates a random function expression, seed 262, number 82.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00082 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b126 \in DOMAIN ((-1 :> 2147483647) @@ (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE)) |-> ([b127 \in UNION {{1, 2}, {1, 2}} |-> (<<5, 6>> @@ [x \in Nat |-> x + 1])])[(-Len(<<3, 1, 2>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00082 failed.
    In applying the function
    [b127 \in {1, 2} |-> <expression line 14, col 143 to line 14, col 175 of module random_00082>],
    the first argument is:
    -3
    which is not in its domain.
---*)
