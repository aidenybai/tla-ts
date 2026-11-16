(*---
description: A .tla file with no matching block yields an empty configuration rather than a file error.
ref: util/MonolithSpecExtractor.java#config
outcome: config-error
args:
  - -config
  - no_block_at_all.tla
---*)
---- MODULE no_block_at_all ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
