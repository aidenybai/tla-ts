(*---
description: An empty block leaves the spec without an initial predicate. The block is activated by a space, so the end marker still ends it.
ref: util/MonolithSpecExtractor.java#config
outcome: config-error
args:
  - -config
  - empty_block.tla
---*)
---- MODULE empty_block ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == FALSE
====
---- CONFIG empty_block ----
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
