(*---
description: \o joins tuples in order.
ref: tlc2/module/Sequences.java#Concat
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE concat_tuples ----
EXTENDS Sequences, Naturals
Test == <<1, 2>> \o <<3>> = <<1, 2, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
