(*---
description: Evaluates a random record expression, seed 262, number 4589.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04589 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[IF ({1} = {x \in 1..3 : x > 1}) THEN DOMAIN <<5, 6>> ELSE ([a |-> 1, b |-> TRUE]).a EXCEPT !.a = (CHOOSE b7192 \in (2147483647 .. 3) : {b7192, 1})] EXCEPT !.a = @ + ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04589 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
