(*---
description: A block with another name doesn't apply, so the configuration is empty.
ref: util/MonolithSpecExtractor.java#config
outcome: config-error
args:
  - -config
  - only_other_block.tla
---*)
---- MODULE only_other_block ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == FALSE
====
---- CONFIG other ----
INIT Init
NEXT Next
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
