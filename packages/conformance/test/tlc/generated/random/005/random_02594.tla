(*---
description: Evaluates a random set expression, seed 262, number 2594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b4090 \in (1..3 \cup Nat) : (b4090 @@ <<5, 6>>)}, ((SUBSET {1} \cup {x \in 1..3 : x > 1}) \cup {3 : b4091 \in 2..1})} \cup ((UNION {{}, {1}} \cap (SUBSET {1} \cup {})) \cup (UNION {{}, {}} \ ({1} \cap SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02594 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
