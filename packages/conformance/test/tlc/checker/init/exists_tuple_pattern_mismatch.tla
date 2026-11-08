(*---
description: "\\E <<a, b>> \\in S fails when an element isn't a tuple of two. The message prints a literal %1 and drops the pattern, because MP.java writes %1 where its format needs %1%."
ref: tlc2/tool/impl/ContextEnumerator.java#ContextEnumerator
outcome: evaluation-failure
features:
  - tlc-bug
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exists_tuple_pattern_mismatch ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == \E <<a, b>> \in {<<1, 2, 3>>} : x = a /\ y = b
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2170:0 Argument mismatch in operator application.%1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 54 in exists_tuple_pattern_mismatch
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
