(*---
description: Evaluates a random record expression, seed 262, number 9619.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09619 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Head(<<>>), b |-> (FALSE => FALSE)] EXCEPT !.a = (CHOOSE b14937 \in UNION {SUBSET {1}, {1, 2}} : (TRUE => TRUE))] EXCEPT !.a = @ + LET b14938 == ((Nat :> -1))[(-1 % 3)] IN CASE (<<>> - b14938) -> IF b14938 THEN -1 ELSE 7 [] OTHER -> CASE FALSE -> b14938 [] OTHER -> b14938])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09619 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
