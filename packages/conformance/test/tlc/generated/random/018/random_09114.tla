(*---
description: Evaluates a random set expression, seed 262, number 9114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (<<b14164, b14164>> = (b14164 :> b14164)) THEN ((2..1 \ {x \in 1..3 : x > 1}) \subseteq (Nat .. Nat)) ELSE IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (b14164 % {2, 1, 3}) ELSE (7 * b14164) : b14164 \in ((UNION {[a |-> 1], {x \in 1..3 : x > 1}} \cap ({1, 2} \cap 2..1)) \cap DOMAIN [[a |-> 1, b |-> TRUE] EXCEPT ![<<1>>] = 1])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09114 failed.
    Attempted to access record by a non-string argument: <<1>>
---*)
