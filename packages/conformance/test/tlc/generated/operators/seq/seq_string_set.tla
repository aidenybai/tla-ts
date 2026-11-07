(*---
description: seq applied to string_set, a UserValue.
ref: tlc2/module/Sequences.java#Seq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE seq_string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1>> \in Seq(STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
---*)
