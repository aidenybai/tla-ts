(*---
description: Evaluates a random set expression, seed 262, number 9701.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09701 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {({b15051 \in SUBSET {1} : <<1, 2>>} \cup DOMAIN TRUE), {(3 % 2), (1 % 0)}} \cup (UNION {{3, <<1>>}, (SUBSET {1} \ Nat)} \cap (((1 :> 2) @@ <<5, 6>>) \cup ({1, 2} \cup {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09701 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 65 to line 14, col 75 of module random_09701
---*)
