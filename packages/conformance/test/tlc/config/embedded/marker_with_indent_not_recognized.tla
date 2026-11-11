(*---
description: String.matches anchors the whole line, so an indented marker isn't one, and the configuration is empty.
ref: util/MonolithSpecExtractor.java#config
outcome: config-error
args:
  - -config
  - marker_with_indent_not_recognized.tla
---*)
---- MODULE marker_with_indent_not_recognized ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====
not part of any module
  ---- CONFIG marker_with_indent_not_recognized ----
INIT Init
NEXT Next
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
