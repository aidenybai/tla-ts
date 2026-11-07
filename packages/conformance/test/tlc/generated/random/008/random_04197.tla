(*---
description: Evaluates a random bool expression, seed 262, number 4197.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04197 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6601 \in (UNION {DOMAIN (1 :> 2), UNION {{1, 2}, 2..1}} \cup {([a |-> 1, b |-> TRUE]).a : b6602 \in UNION {SUBSET {1}, Nat}}) : (((-1 % 2) \in (7 .. b6601)) \/ (\A b6603 \in (b6601 \div b6601) : (SUBSET {1} = {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04197 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
