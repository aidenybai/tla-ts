(*---
description: Evaluates a random set expression, seed 262, number 766.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00766 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CASE TRUE -> 2147483647 [] OTHER -> b1257 * ([a |-> 1]).a) + Len([<<1>> EXCEPT ![1] = b1257])) : b1257 \in {b1258 \in (({1, 2} \cup {}) \cup (SUBSET {1} \ {1})) : (UNION {{}, 2..1} \subseteq (Nat \cap 1..3))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00766 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
