(*---
description: "A LET inside a quantifier creates a fresh binding for every value of the bound variable."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE definition_per_binding_of_enclosing_quantifier ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == \A x \in 1..2 : LET a == P(x, x) IN a = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
