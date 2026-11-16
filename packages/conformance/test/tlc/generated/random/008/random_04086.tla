(*---
description: Evaluates a random set expression, seed 262, number 4086.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6423 \in ((UNION {{2, 1, 3}, 1..3} \cup (1..3 \ SUBSET {1})) \cup (((1 :> 2))[-1] .. (-1 * 0))) : (<<DOMAIN (1 :> 2), ([a |-> 1] - b6423)>> = [b6424 \in {b6425 \in {} : TRUE} |-> (-1 * b6424)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04086 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
