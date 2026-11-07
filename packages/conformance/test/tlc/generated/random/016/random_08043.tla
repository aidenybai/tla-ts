(*---
description: Evaluates a random set expression, seed 262, number 8043.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08043 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12415 \in {IF (~TRUE) THEN (b12416 + b12416) ELSE (3 \div b12416) : b12416 \in UNION {(SUBSET {1} \cup {1}), ({x \in 1..3 : x > 1} \cap {2, 1, 3})}} : (\A b12417 \in (SelectSeq(<<1>>, LAMBDA e : e > 0) \ {2147483647 : b12418 \in {1}}) : (\E b12419 \in {0 : b12420 \in {1}} : (FALSE /\ TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08043 failed.
    Attempted to compare the set {} with the value:
    1
---*)
