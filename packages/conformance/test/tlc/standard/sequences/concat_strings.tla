(*---
description: \o joins strings.
ref: tlc2/module/Sequences.java#Concat
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE concat_strings ----
EXTENDS Sequences, Naturals
Test == "ab" \o "c" = "abc" /\ "" \o "" = "" /\ "a" \o "" = "a"
====

(*--- recorded
all:
  exit: 0
---*)
