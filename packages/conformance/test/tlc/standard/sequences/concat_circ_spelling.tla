(*---
description: \circ is a spelling of \o.
ref: tlc2/module/Sequences.java#Concat
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE concat_circ_spelling ----
EXTENDS Sequences, Naturals
Test == <<1>> \circ <<2>> = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
