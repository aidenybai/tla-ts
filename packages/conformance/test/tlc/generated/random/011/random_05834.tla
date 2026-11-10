(*---
description: Evaluates a random bool expression, seed 262, number 5834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN ((1 :> 2) @@ <<5, 6>>) \cup (Head(<<3, 1, 2>>) .. Cardinality({}))) = {b8992 \in (({} \cup {2, 1, 3}) \cup (FALSE \ {2, 1, 3})) : (CASE FALSE -> -1 [] OTHER -> 2 = LET b8993 == b8992 IN b8993)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05834 failed.
    Attempted to enumerate S \ T when S:
    FALSE
    is not enumerable.
---*)
