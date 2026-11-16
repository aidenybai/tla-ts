(*---
description: The word CONFIG is case-sensitive.
ref: util/MonolithSpecExtractor.java#config
outcome: config-error
args:
  - -config
  - lowercase_config_not_recognized.tla
---*)
---- MODULE lowercase_config_not_recognized ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == FALSE
====
---- config lowercase_config_not_recognized ----
INIT Init
NEXT Next
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
