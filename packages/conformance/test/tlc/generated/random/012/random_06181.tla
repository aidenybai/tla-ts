(*---
description: Evaluates a random set expression, seed 262, number 6181.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06181 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Append((<<1>> \o <<1, 2>>), (-1))) .. LET b9511 == (CHOOSE b9512 \in ({1} \cap (1 :> 2)) : (SUBSET {1} \subseteq SUBSET {1})) IN ((b9511 % 1) - (b9511 + b9511))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06181 failed.
    Attempted to check if the value:
    1
    is an element of the function <<2>>
---*)
