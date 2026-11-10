(*---
description: Evaluates a random set expression, seed 262, number 6067.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE r \in [a : {0} \cup {1}] : TRUE))[(([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[(3 + 1)]], IF (\E b9346 \in ({1, 2} \ SUBSET {1}) : (SUBSET {1} \subseteq {x \in 1..3 : x > 1})) THEN ((7 * 7) % Cardinality(2..1)) ELSE Len(Append(<<>>, -1))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06067 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument 4, which is not in the domain of the function.
---*)
