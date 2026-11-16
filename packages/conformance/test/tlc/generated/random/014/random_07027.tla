(*---
description: Evaluates a random function expression, seed 262, number 7027.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07027 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{0, 2}, (<<1, 2>> \cap {x \in 1..3 : x > 1})} \cup DOMAIN (1 :> 2)) @@ ([b10779 \in (Nat \cap SUBSET {1}) |-> (CHOOSE b10780 \in {1, 2} : TRUE)] @@ [b10781 \in UNION {2..1, 2..1} |-> (b10781 \div b10781)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07027 failed.
    Attempted to check set membership in a tuple value.
---*)
