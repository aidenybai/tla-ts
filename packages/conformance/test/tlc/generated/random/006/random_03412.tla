(*---
description: Evaluates a random function expression, seed 262, number 3412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5414 \in UNION {{b5415 \in {2147483647, 2} : (SUBSET {1} \cap {1})}, (DOMAIN <<5, 6>> \cup {-1, 0})} |-> IF (\A b5416 \in (1..3 \cap SUBSET {1}) : (1..3 = {})) THEN (Cardinality(Nat) * (0 + 2147483647)) ELSE Len(SubSeq(<<1, 2>>, b5414, b5414))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03412 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
