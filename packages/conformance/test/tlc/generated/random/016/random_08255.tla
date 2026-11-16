(*---
description: Evaluates a random set expression, seed 262, number 8255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(0 - 3) : b12773 \in {b12774 \in 1..3 : FALSE}} \cup {CASE FALSE -> b12775 [] OTHER -> b12775 : b12775 \in (SUBSET {1} \cup 1..3)}) \cup {[(CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![IF FALSE THEN b12776 ELSE -1] = (<<5, 6>>)[[a |-> 1, b |-> TRUE]]] : b12776 \in ({b12777 \in {1} : <<1>>} \ {b12778 : b12778 \in {}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08255 failed.
    Attempted to compare the set {} with the value:
    2
---*)
