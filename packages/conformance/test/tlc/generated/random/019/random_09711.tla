(*---
description: Evaluates a random seq expression, seed 262, number 9711.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09711 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append((Append(<<>>, 7) \o Append(<<3, 1, 2>>, 0)), (CHOOSE b15069 \in {2147483647, 1} : (\E b15070 \in SUBSET {1} : -1))) \o ([(CHOOSE f \in [{} -> {1}] : TRUE) EXCEPT ![CASE TRUE -> 2147483647 [] OTHER -> 1] = (7 - 1)] @@ [(7 :> 7) EXCEPT ![(-1 - 0)] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09711 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 107 to line 14, col 135 of module random_09711
---*)
