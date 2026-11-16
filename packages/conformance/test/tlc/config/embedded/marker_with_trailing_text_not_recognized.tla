(*---
description: String.matches anchors the whole line, so text after the dashes stops the marker from matching.
ref: util/MonolithSpecExtractor.java#config
outcome: config-error
args:
  - -config
  - marker_with_trailing_text_not_recognized.tla
---*)
---- MODULE marker_with_trailing_text_not_recognized ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == FALSE
====
---- CONFIG marker_with_trailing_text_not_recognized ---- trailing
INIT Init
NEXT Next
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
