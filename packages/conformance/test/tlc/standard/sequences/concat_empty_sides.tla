(*---
description: An empty side yields the other.
ref: tlc2/module/Sequences.java#Concat
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE concat_empty_sides ----
EXTENDS Sequences, Naturals
Test == <<>> \o <<1>> = <<1>> /\ <<1>> \o <<>> = <<1>> /\ <<>> \o <<>> = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
